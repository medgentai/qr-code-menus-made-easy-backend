import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VenuesService } from '../venues/venues.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { TaxCalculationService } from '../tax/services/tax-calculation.service';

import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto, UpdateOrderItemQuantityDto } from './dto/update-order.dto';
import { MarkOrderPaidDto, MarkOrderUnpaidDto, PaymentStatusResponse } from './dto/mark-order-paid.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { OrderStatus, OrderPaymentStatus, OrderItemStatus, Prisma, ServiceType, PaymentMethod } from '@prisma/client';
import { OrderItemForTaxDto } from '../tax/dto/tax-calculation.dto';
import { OrderEventsGateway } from './events/order-events.gateway';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private venuesService: VenuesService,
    private organizationsService: OrganizationsService,
    private orderEventsGateway: OrderEventsGateway,
    private taxCalculationService: TaxCalculationService,
  ) {}

  /**
   * Create a new order
   */
  async create(createOrderDto: CreateOrderDto, userId: string) {
    // Special handling for public orders (system user)
    if (userId === 'system') {
      // For public orders, we just need to verify the venue exists
      const venue = await this.prisma.venue.findUnique({
        where: { id: createOrderDto.venueId },
      });

      if (!venue) {
        throw new NotFoundException(`Venue with ID ${createOrderDto.venueId} not found`);
      }

      // If tableId is provided, check if it belongs to the venue
      if (createOrderDto.tableId) {
        const table = await this.prisma.table.findUnique({
          where: { id: createOrderDto.tableId },
        });

        if (!table || table.venueId !== venue.id) {
          throw new BadRequestException(
            `Table with ID ${createOrderDto.tableId} does not exist or does not belong to the venue`,
          );
        }
      }
    } else {
      // Regular user flow - check if venue exists and user has access
      const venue = await this.venuesService.findOne(
        createOrderDto.venueId,
        userId,
      );

      // If tableId is provided, check if it belongs to the venue
      if (createOrderDto.tableId) {
        const table = await this.prisma.table.findUnique({
          where: { id: createOrderDto.tableId },
        });

        if (!table || table.venueId !== venue.id) {
          throw new BadRequestException(
            `Table with ID ${createOrderDto.tableId} does not exist or does not belong to the venue`,
          );
        }
      }
    }

    // Calculate order total and prepare items
    const { orderItems, subtotal, taxAmount, totalAmount, taxBreakdown } = await this.calculateOrderItems(
      createOrderDto.items,
      createOrderDto.venueId,
      createOrderDto.serviceType || ServiceType.DINE_IN,
    );

    // Create the order with items
    console.log('Creating order with data:', {
      venueId: createOrderDto.venueId,
      tableId: createOrderDto.tableId,
      customerName: createOrderDto.customerName,
      customerEmail: createOrderDto.customerEmail,
      customerPhone: createOrderDto.customerPhone,
      roomNumber: createOrderDto.roomNumber,
      partySize: createOrderDto.partySize,
      status: createOrderDto.status || OrderStatus.PENDING,
      totalAmount,
      notes: createOrderDto.notes,
    });

    const newOrder = await this.prisma.order.create({
      data: {
        venueId: createOrderDto.venueId,
        tableId: createOrderDto.tableId,
        customerName: createOrderDto.customerName,
        customerEmail: createOrderDto.customerEmail,
        customerPhone: createOrderDto.customerPhone,
        roomNumber: createOrderDto.roomNumber,
        partySize: createOrderDto.partySize,
        status: createOrderDto.status || OrderStatus.PENDING,
        subtotalAmount: subtotal,
        taxAmount: taxAmount,
        taxRate: taxBreakdown.taxRate,
        taxType: taxBreakdown.taxType,
        serviceType: createOrderDto.serviceType || ServiceType.DINE_IN,
        totalAmount,
        isTaxExempt: taxBreakdown.isTaxExempt,
        isPriceInclusive: taxBreakdown.isPriceInclusive,
        notes: createOrderDto.notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        venue: true,
        table: {
          include: {
            venue: true,
          }
        },
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
      },
    });

    // Emit new order event
    if (newOrder) {
      const timestamp = new Date();
      const message = `New order #${newOrder.id.substring(0, 8)} created with status ${newOrder.status}`;

      // Get venue info from table relationship if available, otherwise fetch directly
      let venueId = newOrder.table?.venue?.id;
      let organizationId = newOrder.table?.venue?.organizationId;

      // If we don't have venue info from table (e.g., no tableId), fetch it directly
      if (!venueId && createOrderDto.venueId) {
        try {
          const venue = await this.prisma.venue.findUnique({
            where: { id: createOrderDto.venueId },
            select: { id: true, organizationId: true }
          });

          if (venue) {
            venueId = venue.id;
            organizationId = venue.organizationId;
          }
        } catch (error) {
          this.logger.warn(`Failed to fetch venue info for WebSocket event: ${error.message}`);
        }
      }

      // Only emit if we have venue and organization info
      if (venueId && organizationId) {
        // Emit WebSocket event
        this.orderEventsGateway.emitNewOrder({
          orderId: newOrder.id,
          status: newOrder.status,
          tableId: newOrder.tableId || undefined,
          venueId,
          organizationId,
          timestamp,
          message,
        });
      }
    }

    return newOrder;
  }

  /**
   * Find all orders with filtering and pagination
   */
  async findAll(filterDto: FilterOrdersDto, userId: string) {
    // Build the where clause based on filter criteria
    const where: Prisma.OrderWhereInput = {};

    if (filterDto.venueId) {
      // Check if user has access to the venue
      await this.venuesService.findOne(filterDto.venueId, userId);

      // Get all tables for the venue
      const tables = await this.prisma.table.findMany({
        where: { venueId: filterDto.venueId },
        select: { id: true },
      });

      where.OR = [
        // Orders with tables from this venue
        {
          tableId: {
            in: tables.map((table) => table.id),
          },
        },
        // Orders without tables but directly associated with this venue
        {
          venueId: filterDto.venueId,
          tableId: null,
        }
      ];
    }

    if (filterDto.tableId) {
      // Check if table exists and user has access
      const table = await this.prisma.table.findUnique({
        where: { id: filterDto.tableId },
        include: { venue: true },
      });

      if (!table) {
        throw new NotFoundException(`Table with ID ${filterDto.tableId} not found`);
      }

      // Check if user has access to the venue
      await this.venuesService.findOne(table.venueId, userId);

      where.tableId = filterDto.tableId;
    }

    if (filterDto.status) {
      where.status = filterDto.status;
    }

    if (filterDto.customerName) {
      where.customerName = {
        contains: filterDto.customerName,
        mode: 'insensitive',
      };
    }

    if (filterDto.customerEmail) {
      where.customerEmail = {
        contains: filterDto.customerEmail,
        mode: 'insensitive',
      };
    }

    if (filterDto.customerPhone) {
      where.customerPhone = {
        contains: filterDto.customerPhone,
      };
    }

    if (filterDto.roomNumber) {
      where.roomNumber = {
        contains: filterDto.roomNumber,
      };
    }

    if (filterDto.createdAfter || filterDto.createdBefore) {
      where.createdAt = {};

      if (filterDto.createdAfter) {
        where.createdAt.gte = new Date(filterDto.createdAfter);
      }

      if (filterDto.createdBefore) {
        where.createdAt.lte = new Date(filterDto.createdBefore);
      }
    }

    // Calculate pagination parameters
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.prisma.order.count({ where });
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Get paginated orders that match the criteria
    const orders = await this.prisma.order.findMany({
      where,
      include: {
        venue: true,
        table: {
          include: {
            venue: true,
          },
        },
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Return paginated response
    return {
      data: orders,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Find orders for a venue with pagination
   */
  async findAllForVenue(venueId: string, userId: string, page = 1, limit = 10, status?: OrderStatus) {
    // Check if venue exists and user has access
    await this.venuesService.findOne(venueId, userId);

    // Get all tables for the venue
    const tables = await this.prisma.table.findMany({
      where: { venueId },
      select: { id: true },
    });

    // Calculate pagination parameters
    const skip = (page - 1) * limit;

    // Define where clause - include orders with tables OR orders directly associated with venue
    const where: Prisma.OrderWhereInput = {
      OR: [
        // Orders with tables from this venue
        {
          tableId: {
            in: tables.map((table) => table.id),
          },
        },
        // Orders without tables but directly associated with this venue (food trucks, etc.)
        {
          venueId: venueId,
          tableId: null,
        }
      ]
    };

    console.log('findAllForVenue - venueId:', venueId);
    console.log('findAllForVenue - tables found:', tables.length);
    console.log('findAllForVenue - where clause:', JSON.stringify(where, null, 2));

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    // Get total count for pagination
    const total = await this.prisma.order.count({ where });
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Get paginated orders for the tables
    const orders = await this.prisma.order.findMany({
      where,
      include: {
        venue: true,
        table: {
          include: {
            venue: true,
          },
        },
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    console.log('findAllForVenue - orders found:', orders.length);
    console.log('findAllForVenue - orders:', orders.map(o => ({
      id: o.id,
      venueId: o.venueId,
      tableId: o.tableId,
      customerName: o.customerName,
      venue: o.venue?.name,
      table: o.table?.name
    })));

    // Return paginated response
    return {
      data: orders,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Find orders for an organization with pagination
   */
  async findAllForOrganization(organizationId: string, userId: string, page = 1, limit = 10, status?: OrderStatus) {
    console.log('findAllForOrganization called with:', { organizationId, userId, page, limit, status });

    // Check if user is a member of the organization and get member details
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: organizationId,
          userId: userId
        }
      }
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    console.log('Member found:', { role: member.role, venueIds: member.venueIds });

    // Calculate pagination parameters
    const skip = (page - 1) * limit;

    // Build optimized where clause based on role - avoid intermediate table queries
    let where: Prisma.OrderWhereInput;

    if (member.role === 'STAFF' && member.venueIds && member.venueIds.length > 0) {
      // Staff members: Direct venue filtering (more efficient)
      where = {
        OR: [
          // Orders with tables from assigned venues
          {
            table: {
              venueId: {
                in: member.venueIds,
              },
            },
          },
          // Orders without tables but directly associated with assigned venues
          {
            venueId: {
              in: member.venueIds,
            },
            tableId: null,
          }
        ]
      };
    } else {
      // Managers, Administrators, and Owners: Organization-level filtering
      where = {
        OR: [
          // Orders with tables from organization venues
          {
            table: {
              venue: {
                organizationId,
              },
            },
          },
          // Orders without tables but directly associated with organization venues
          {
            venue: {
              organizationId,
            },
            tableId: null,
          }
        ]
      };
    }

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    console.log('findAllForOrganization - where clause:', JSON.stringify(where, null, 2));

    // Debug: Check all orders in database
    const allOrders = await this.prisma.order.findMany({
      select: { id: true, venueId: true, tableId: true, customerName: true },
      take: 10
    });
    console.log('All orders in database (first 10):', allOrders);

    // Debug: Check venues for this organization
    const venues = await this.prisma.venue.findMany({
      where: { organizationId },
      select: { id: true, name: true, organizationId: true }
    });
    console.log('Venues for organization:', venues);

    // Get total count and orders in parallel for better performance
    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          venue: true,
          table: {
            include: {
              venue: true,
            },
          },
          items: {
            include: {
              menuItem: true,
              modifiers: {
                include: {
                  modifier: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    console.log('findAllForOrganization - results:', {
      total,
      ordersFound: orders.length,
      orders: orders.map(o => ({
        id: o.id,
        venueId: o.venueId,
        tableId: o.tableId,
        customerName: o.customerName,
        venue: o.venue?.name,
        table: o.table?.name
      }))
    });

    // Return paginated response
    return {
      data: orders,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Find orders with combined filtering (organization, venue, status)
   * This method handles all filter combinations in a single API call
   */
  async findFiltered(filterDto: FilterOrdersDto, userId: string) {
    console.log('findFiltered called with:', filterDto);

    // Build the where clause based on filter criteria
    const where: Prisma.OrderWhereInput = {};

    // Handle organization filter
    if (filterDto.organizationId) {
      // Check if user is a member of the organization and get member details
      const member = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: filterDto.organizationId,
            userId: userId
          }
        }
      });

      if (!member) {
        throw new ForbiddenException('You are not a member of this organization');
      }

      // Build optimized where clause based on role - avoid intermediate queries
      if (member.role === 'STAFF' && member.venueIds && member.venueIds.length > 0) {
        // Staff members: Direct venue filtering
        const venueIds = filterDto.venueId
          ? member.venueIds.filter(id => id === filterDto.venueId)
          : member.venueIds;

        if (venueIds.length === 0) {
          where.id = 'non-existent-id'; // This will return no results
        } else {
          where.OR = [
            // Orders with tables from assigned venues
            {
              table: {
                venueId: {
                  in: venueIds,
                },
              },
            },
            // Orders without tables but directly associated with assigned venues
            {
              venueId: {
                in: venueIds,
              },
              tableId: null,
            }
          ];
        }
      } else {
        // Managers, Administrators, and Owners: Organization-level filtering
        if (filterDto.venueId) {
          // Filter to specific venue within organization
          where.OR = [
            // Orders with tables from the specific venue
            {
              table: {
                venueId: filterDto.venueId,
                venue: {
                  organizationId: filterDto.organizationId,
                },
              },
            },
            // Orders without tables but directly associated with the specific venue
            {
              venueId: filterDto.venueId,
              venue: {
                organizationId: filterDto.organizationId,
              },
              tableId: null,
            }
          ];
        } else {
          // All venues in organization
          where.OR = [
            // Orders with tables from organization venues
            {
              table: {
                venue: {
                  organizationId: filterDto.organizationId,
                },
              },
            },
            // Orders without tables but directly associated with organization venues
            {
              venue: {
                organizationId: filterDto.organizationId,
              },
              tableId: null,
            }
          ];
        }
      }
    }
    // Handle venue filter without organization filter
    else if (filterDto.venueId) {
      // Check if user has access to the venue
      await this.venuesService.findOne(filterDto.venueId, userId);

      // Get all tables for the venue
      const tables = await this.prisma.table.findMany({
        where: { venueId: filterDto.venueId },
        select: { id: true },
      });

      where.OR = [
        // Orders with tables from this venue
        {
          tableId: {
            in: tables.map(table => table.id),
          },
        },
        // Orders without tables but directly associated with this venue
        {
          venueId: filterDto.venueId,
          tableId: null,
        }
      ];
    }

    // Add status filter if provided
    if (filterDto.status) {
      where.status = filterDto.status;
    }

    // Add table filter if provided
    if (filterDto.tableId) {
      // Check if table exists and user has access
      const table = await this.prisma.table.findUnique({
        where: { id: filterDto.tableId },
        include: { venue: true },
      });

      if (!table) {
        throw new NotFoundException(`Table with ID ${filterDto.tableId} not found`);
      }

      // Check if user has access to the venue
      await this.venuesService.findOne(table.venueId, userId);

      where.tableId = filterDto.tableId;
    }

    // Add customer filters if provided
    if (filterDto.customerName) {
      where.customerName = {
        contains: filterDto.customerName,
        mode: 'insensitive',
      };
    }

    if (filterDto.customerEmail) {
      where.customerEmail = {
        contains: filterDto.customerEmail,
        mode: 'insensitive',
      };
    }

    if (filterDto.customerPhone) {
      where.customerPhone = {
        contains: filterDto.customerPhone,
      };
    }

    if (filterDto.roomNumber) {
      where.roomNumber = {
        contains: filterDto.roomNumber,
      };
    }

    // Add date range filters if provided
    if (filterDto.createdAfter || filterDto.createdBefore) {
      where.createdAt = {};

      if (filterDto.createdAfter) {
        where.createdAt.gte = new Date(filterDto.createdAfter);
      }

      if (filterDto.createdBefore) {
        where.createdAt.lte = new Date(filterDto.createdBefore);
      }
    }

    // Calculate pagination parameters
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const skip = (page - 1) * limit;

    console.log('findFiltered - final where clause:', JSON.stringify(where, null, 2));

    // Get total count and orders in parallel for better performance
    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          venue: true,
          table: {
            include: {
              venue: true,
            },
          },
          items: {
            include: {
              menuItem: true,
              modifiers: {
                include: {
                  modifier: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    console.log('findFiltered - results:', {
      total,
      ordersFound: orders.length,
      orders: orders.map(o => ({
        id: o.id,
        venueId: o.venueId,
        tableId: o.tableId,
        customerName: o.customerName,
        venue: o.venue?.name,
        table: o.table?.name
      }))
    });

    // Return paginated response
    return {
      data: orders,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Find an order by ID
   */
  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        venue: true,
        table: {
          include: {
            venue: true,
          },
        },
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Special handling for public orders (system user)
    if (userId !== 'system') {
      // Check if user has access to the venue
      if (order.venue) {
        await this.venuesService.findOne(order.venue.id, userId);
      } else if (order.table) {
        await this.venuesService.findOne(order.table.venueId, userId);
      }
    }

    return order;
  }

  /**
   * Update an order
   */
  async update(id: string, updateOrderDto: UpdateOrderDto, userId: string) {
    // Check if order exists and user has access
    await this.findOne(id, userId);

    // Prepare data for update
    const updateData: Prisma.OrderUpdateInput = {};

    // Update basic fields if provided
    if (updateOrderDto.tableId !== undefined) {
      updateData.table = {
        connect: { id: updateOrderDto.tableId }
      };
    }

    if (updateOrderDto.customerName !== undefined) {
      updateData.customerName = updateOrderDto.customerName;
    }

    if (updateOrderDto.customerEmail !== undefined) {
      updateData.customerEmail = updateOrderDto.customerEmail;
    }

    if (updateOrderDto.customerPhone !== undefined) {
      updateData.customerPhone = updateOrderDto.customerPhone;
    }

    if (updateOrderDto.roomNumber !== undefined) {
      updateData.roomNumber = updateOrderDto.roomNumber;
    }

    if (updateOrderDto.notes !== undefined) {
      updateData.notes = updateOrderDto.notes;
    }

    // Handle status change
    if (updateOrderDto.status !== undefined) {
      updateData.status = updateOrderDto.status;

      // If status is changed to COMPLETED, set completedAt
      if (updateOrderDto.status === OrderStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
    }

    // Handle adding new items
    if (updateOrderDto.addItems && updateOrderDto.addItems.length > 0) {
      // Get the current order to access venue and service type
      const currentOrder = await this.prisma.order.findUnique({
        where: { id },
        select: { venueId: true, serviceType: true },
      });

      if (!currentOrder) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      const { orderItems } = await this.calculateOrderItems(
        updateOrderDto.addItems,
        currentOrder.venueId!,
        currentOrder.serviceType,
      );

      // Create new items
      for (const item of orderItems) {
        await this.prisma.orderItem.create({
          data: {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes,
            status: item.status,
            orderId: id,
            modifiers: item.modifiers,
          },
        });
      }

    }

    // Handle updating existing items (quantity/notes)
    if (updateOrderDto.updateItems && updateOrderDto.updateItems.length > 0) {
      for (const updateItem of updateOrderDto.updateItems) {
        // Check if item exists and belongs to the order
        const existingItem = await this.prisma.orderItem.findUnique({
          where: { id: updateItem.itemId },
        });

        if (!existingItem || existingItem.orderId !== id) {
          throw new BadRequestException(
            `Order item with ID ${updateItem.itemId} not found or does not belong to the order`,
          );
        }

        // Prepare update data
        const itemUpdateData: Prisma.OrderItemUpdateInput = {};
        let totalAmountChange = 0;

        // Update quantity if provided
        if (updateItem.quantity !== undefined) {
          const newQuantity = updateItem.quantity;
          const unitPrice = Number(existingItem.unitPrice);

          // Calculate new total price for the item
          const oldTotalPrice = Number(existingItem.totalPrice);
          const newTotalPrice = unitPrice * newQuantity;

          // Update item data
          itemUpdateData.quantity = newQuantity;
          itemUpdateData.totalPrice = newTotalPrice;

          // Track total amount change
          totalAmountChange += newTotalPrice - oldTotalPrice;
        }

        // Update notes if provided
        if (updateItem.notes !== undefined) {
          itemUpdateData.notes = updateItem.notes;
        }

        // Update the item
        await this.prisma.orderItem.update({
          where: { id: updateItem.itemId },
          data: itemUpdateData,
        });

        // Update order total amount if quantity changed
        if (totalAmountChange !== 0) {
          await this.prisma.order.update({
            where: { id },
            data: {
              totalAmount: {
                increment: totalAmountChange,
              },
            },
          });
        }
      }
    }

    // Handle removing items
    if (updateOrderDto.removeItemIds && updateOrderDto.removeItemIds.length > 0) {
      // Delete the items
      await this.prisma.orderItem.deleteMany({
        where: {
          id: {
            in: updateOrderDto.removeItemIds,
          },
          orderId: id,
        },
      });
    }

    // Update the order
    let updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        table: {
          include: {
            venue: true,
          },
        },
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
      },
    });

    // Recalculate totals if items were added or removed
    if ((updateOrderDto.addItems && updateOrderDto.addItems.length > 0) ||
        (updateOrderDto.removeItemIds && updateOrderDto.removeItemIds.length > 0)) {
      await this.recalculateOrderTotals(id);

      // Fetch the updated order with all relations
      const recalculatedOrder = await this.prisma.order.findUnique({
        where: { id },
        include: {
          table: {
            include: {
              venue: true,
            },
          },
          items: {
            include: {
              menuItem: true,
              modifiers: {
                include: {
                  modifier: true,
                },
              },
            },
          },
        },
      });

      if (recalculatedOrder) {
        updatedOrder = recalculatedOrder;
      }
    }

    // Emit order updated event if status was changed
    if (updateOrderDto.status !== undefined) {
      const timestamp = new Date();
      const message = `Order #${updatedOrder.id.substring(0, 8)} updated to status ${updatedOrder.status}`;
      const venueId = updatedOrder.table?.venue?.id;
      const organizationId = updatedOrder.table?.venue?.organizationId;

      // Emit WebSocket event
      this.orderEventsGateway.emitOrderEvent({
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        tableId: updatedOrder.tableId || undefined,
        venueId,
        organizationId,
        timestamp,
        message,
      });


    }

    return updatedOrder;
  }

  /**
   * Update an order item
   */
  async updateOrderItem(
    orderId: string,
    itemId: string,
    updateOrderItemDto: UpdateOrderItemDto,
    userId: string,
  ) {
    // Check if order exists and user has access
    await this.findOne(orderId, userId);

    // Check if item exists and belongs to the order
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.orderId !== orderId) {
      throw new NotFoundException(
        `Order item with ID ${itemId} not found or does not belong to the order`,
      );
    }

    // Prepare data for update
    const updateData: Prisma.OrderItemUpdateInput = {};

    // Update basic fields if provided
    if (updateOrderItemDto.notes !== undefined) {
      updateData.notes = updateOrderItemDto.notes;
    }

    if (updateOrderItemDto.status !== undefined) {
      updateData.status = updateOrderItemDto.status;
    }

    // Handle quantity change
    if (updateOrderItemDto.quantity !== undefined) {
      const newQuantity = updateOrderItemDto.quantity;
      const unitPrice = Number(item.unitPrice);

      // Calculate new total price (excluding modifiers for now)
      const newTotalPrice = unitPrice * newQuantity;

      // Update quantity and total price
      updateData.quantity = newQuantity;
      updateData.totalPrice = newTotalPrice;
    }

    // Handle adding modifiers
    if (updateOrderItemDto.addModifiers && updateOrderItemDto.addModifiers.length > 0) {
      // Get the modifiers
      const modifierIds = updateOrderItemDto.addModifiers.map(
        (m) => m.modifierId,
      );
      const modifiers = await this.prisma.modifier.findMany({
        where: {
          id: {
            in: modifierIds,
          },
        },
      });

      // Create modifiers for the item
      for (const modifier of modifiers) {
        await this.prisma.orderItemModifier.create({
          data: {
            orderItemId: itemId,
            modifierId: modifier.id,
            price: modifier.price,
          },
        });
      }
    }

    // Handle removing modifiers
    if (updateOrderItemDto.removeModifierIds && updateOrderItemDto.removeModifierIds.length > 0) {
      // Delete the modifiers
      await this.prisma.orderItemModifier.deleteMany({
        where: {
          id: {
            in: updateOrderItemDto.removeModifierIds,
          },
          orderItemId: itemId,
        },
      });
    }

    // Update the item
    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        menuItem: true,
        modifiers: {
          include: {
            modifier: true,
          },
        },
      },
    });

    // Recalculate order totals if quantity or modifiers were changed
    if (updateOrderItemDto.quantity !== undefined ||
        (updateOrderItemDto.addModifiers && updateOrderItemDto.addModifiers.length > 0) ||
        (updateOrderItemDto.removeModifierIds && updateOrderItemDto.removeModifierIds.length > 0)) {
      await this.recalculateOrderTotals(orderId);
    }

    // Emit order item updated event if status was changed
    if (updateOrderItemDto.status !== undefined) {
      const timestamp = new Date();
      const message = `Order item #${itemId.substring(0, 8)} updated to status ${updatedItem.status}`;

      // Emit WebSocket event
      this.orderEventsGateway.emitOrderItemEvent({
        orderId,
        orderItemId: itemId,
        status: updatedItem.status,
        timestamp,
        message,
      });


    }

    return updatedItem;
  }

  /**
   * Remove an order
   */
  async remove(id: string, userId: string) {
    // Check if order exists and user has access
    await this.findOne(id, userId);

    // Delete the order (cascade will delete items and modifiers)
    return this.prisma.order.delete({
      where: { id },
    });
  }

  /**
   * Calculate order items and total amount with tax
   */
  private async calculateOrderItems(
    items: CreateOrderItemDto[],
    venueId: string,
    serviceType: ServiceType
  ) {
    const orderItems: Array<{
      menuItemId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      notes?: string;
      status: OrderItemStatus;
      modifiers: {
        create: Array<{
          modifierId: string;
          price: number;
        }>;
      };
    }> = [];

    const taxItems: OrderItemForTaxDto[] = [];

    for (const item of items) {
      // Get menu item
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });

      if (!menuItem) {
        throw new BadRequestException(
          `Menu item with ID ${item.menuItemId} not found`,
        );
      }

      // Calculate item price - use discounted price if available, otherwise use regular price
      const unitPrice = Number(menuItem.discountPrice || menuItem.price);
      let totalPrice = unitPrice * item.quantity;
      let modifiersPrice = 0;

      // Prepare modifiers
      const modifierData: Array<{
        modifierId: string;
        price: number;
      }> = [];

      if (item.modifiers && item.modifiers.length > 0) {
        // Get modifiers
        const modifierIds = item.modifiers.map((m) => m.modifierId);
        const modifiers = await this.prisma.modifier.findMany({
          where: {
            id: {
              in: modifierIds,
            },
          },
        });

        // Calculate modifiers price
        for (const modifier of modifiers) {
          const modifierPrice = Number(modifier.price);
          totalPrice += modifierPrice;
          modifiersPrice += modifierPrice;
          modifierData.push({
            modifierId: modifier.id,
            price: modifierPrice,
          });
        }
      }

      // Add to order items
      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        notes: item.notes,
        status: OrderItemStatus.PENDING,
        modifiers: {
          create: modifierData,
        },
      });

      // Add to tax calculation items
      taxItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        modifiersPrice: modifiersPrice > 0 ? modifiersPrice : undefined,
      });
    }

    // Get venue and organization information for tax calculation
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        organization: true,
      },
    });

    if (!venue) {
      throw new BadRequestException(`Venue with ID ${venueId} not found`);
    }

    // Calculate tax using the tax calculation service
    const taxCalculation = await this.taxCalculationService.calculateOrderTax(
      venue.organizationId,
      venue.organization.type,
      serviceType,
      taxItems
    );

    return {
      orderItems,
      subtotal: taxCalculation.subtotalAmount,
      taxAmount: taxCalculation.taxAmount,
      totalAmount: taxCalculation.totalAmount,
      taxBreakdown: taxCalculation.taxBreakdown,
    };
  }

  /**
   * Recalculate order totals based on current items
   */
  private async recalculateOrderTotals(orderId: string) {
    // Get the order with all its items and venue information
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
        venue: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Convert order items to tax calculation format
    const taxItems: OrderItemForTaxDto[] = order.items.map((item) => {
      const modifiersPrice = item.modifiers.reduce(
        (sum, mod) => sum + Number(mod.price),
        0
      );

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        modifiersPrice: modifiersPrice > 0 ? modifiersPrice : undefined,
      };
    });

    // Calculate tax using the tax calculation service
    const taxCalculation = await this.taxCalculationService.calculateOrderTax(
      order.venue!.organizationId,
      order.venue!.organization.type,
      order.serviceType,
      taxItems
    );

    // Update the order with new totals
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        subtotalAmount: taxCalculation.subtotalAmount,
        taxAmount: taxCalculation.taxAmount,
        taxRate: taxCalculation.taxBreakdown.taxRate,
        taxType: taxCalculation.taxBreakdown.taxType,
        totalAmount: taxCalculation.totalAmount,
        isTaxExempt: taxCalculation.taxBreakdown.isTaxExempt,
        isPriceInclusive: taxCalculation.taxBreakdown.isPriceInclusive,
      },
    });
  }

  /**
   * Mark an order as paid
   */
  async markOrderAsPaid(orderId: string, paymentData: MarkOrderPaidDto, userId: string) {
    // First, verify the order exists and user has access
    const order = await this.findOne(orderId, userId);

    // Validate payment amount if provided
    if (paymentData.amount && Math.abs(paymentData.amount - Number(order.totalAmount)) > 0.01) {
      throw new BadRequestException(
        `Payment amount ${paymentData.amount} does not match order total ${order.totalAmount}`
      );
    }

    // Update the order payment status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: OrderPaymentStatus.PAID,
        paidAt: new Date(),
        paidBy: userId,
        paymentMethod: paymentData.paymentMethod,
        paymentNotes: paymentData.paymentNotes,
      },
      include: {
        venue: true,
        table: {
          include: {
            venue: true,
          },
        },
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
        paidByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit payment status change event
    const timestamp = new Date();
    const message = `Order #${updatedOrder.id.substring(0, 8)} marked as PAID`;
    const venueId = updatedOrder.table?.venue?.id || updatedOrder.venue?.id;
    const organizationId = updatedOrder.table?.venue?.organizationId || updatedOrder.venue?.organizationId;

    if (venueId && organizationId) {
      this.orderEventsGateway.emitOrderEvent({
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        tableId: updatedOrder.tableId || undefined,
        venueId,
        organizationId,
        timestamp,
        message,
      });
    }

    this.logger.log(`Order ${orderId} marked as paid by user ${userId}`);
    return updatedOrder;
  }

  /**
   * Mark an order as unpaid
   */
  async markOrderAsUnpaid(orderId: string, unpaidData: MarkOrderUnpaidDto, userId: string) {
    // First, verify the order exists and user has access
    const order = await this.findOne(orderId, userId);

    // Update the order payment status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: OrderPaymentStatus.UNPAID,
        paidAt: null,
        paidBy: null,
        paymentMethod: null,
        paymentNotes: unpaidData.reason ? `Marked unpaid: ${unpaidData.reason}` : null,
      },
      include: {
        venue: true,
        table: {
          include: {
            venue: true,
          },
        },
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
      },
    });

    // Emit payment status change event
    const timestamp = new Date();
    const message = `Order #${updatedOrder.id.substring(0, 8)} marked as UNPAID`;
    const venueId = updatedOrder.table?.venue?.id || updatedOrder.venue?.id;
    const organizationId = updatedOrder.table?.venue?.organizationId || updatedOrder.venue?.organizationId;

    if (venueId && organizationId) {
      this.orderEventsGateway.emitOrderEvent({
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        tableId: updatedOrder.tableId || undefined,
        venueId,
        organizationId,
        timestamp,
        message,
      });
    }

    this.logger.log(`Order ${orderId} marked as unpaid by user ${userId}`);
    return updatedOrder;
  }

  /**
   * Get payment status for an order
   */
  async getOrderPaymentStatus(orderId: string, userId: string): Promise<PaymentStatusResponse> {
    // Use findOne which already includes access control
    const order = await this.prisma.order.findFirst({
      where: { id: orderId },
      include: {
        venue: true,
        table: {
          include: {
            venue: true,
          },
        },
        paidByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access using the same logic as findOne
    if (userId !== 'system') {
      // Check if user has access to the venue
      if (order.venue) {
        await this.venuesService.findOne(order.venue.id, userId);
      } else if (order.table) {
        await this.venuesService.findOne(order.table.venueId, userId);
      }
    }

    return {
      paymentStatus: order.paymentStatus,
      paidAt: order.paidAt,
      paidBy: order.paidBy,
      paidByName: order.paidByUser?.name || null,
      paymentMethod: order.paymentMethod,
      paymentNotes: order.paymentNotes,
      totalAmount: Number(order.totalAmount),
    };
  }

  /**
   * Get all unpaid orders for a venue
   */
  async getUnpaidOrders(venueId: string, userId: string) {
    // Check if venue exists and user has access
    await this.venuesService.findOne(venueId, userId);

    // Get all tables for the venue
    const tables = await this.prisma.table.findMany({
      where: { venueId },
      select: { id: true },
    });

    // Find unpaid orders - exclude cancelled orders
    const unpaidOrders = await this.prisma.order.findMany({
      where: {
        paymentStatus: OrderPaymentStatus.UNPAID,
        status: {
          not: OrderStatus.CANCELLED, // Exclude cancelled orders
        },
        OR: [
          // Orders with tables from this venue
          {
            tableId: {
              in: tables.map((table) => table.id),
            },
          },
          // Orders without tables but directly associated with this venue
          {
            venueId: venueId,
            tableId: null,
          }
        ]
      },
      include: {
        venue: true,
        table: {
          include: {
            venue: true,
          },
        },
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return unpaidOrders;
  }
}
