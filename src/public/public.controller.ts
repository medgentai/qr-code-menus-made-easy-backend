import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PublicService } from './public.service';
import { MenuEntity } from '../menus/entities/menu.entity';
import { QrCodeEntity } from '../qr-codes/entities/qr-code.entity';
import { OrdersService } from '../orders/orders.service';
import { VenuesService } from '../venues/venues.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly ordersService: OrdersService,
    private readonly venuesService: VenuesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('menus/organization/:slug')
  @Public()
  @ApiOperation({ summary: 'Get active menus for an organization by slug' })
  @ApiParam({ name: 'slug', description: 'Organization slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all active menus for the organization.',
    type: [MenuEntity],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found.',
  })
  findMenusByOrganizationSlug(@Param('slug') slug: string) {
    return this.publicService.findMenusByOrganizationSlug(slug);
  }

  @Get('menus/:id')
  @Public()
  @ApiOperation({ summary: 'Get a menu by ID' })
  @ApiParam({ name: 'id', description: 'Menu ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the menu with categories and items.',
    type: MenuEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu not found.',
  })
  findMenuById(@Param('id') id: string) {
    return this.publicService.findMenuById(id);
  }

  @Get('organization/:slug/menu')
  @Public()
  @ApiOperation({ summary: 'Get menu for an organization by slug with optional table or venue' })
  @ApiParam({ name: 'slug', description: 'Organization slug' })
  @ApiQuery({ name: 'table', required: false, description: 'Table ID' })
  @ApiQuery({ name: 'venue', required: false, description: 'Venue ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the menu for the organization.',
    type: MenuEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization, menu, table, or venue not found.',
  })
  findMenuByOrganizationAndTable(
    @Param('slug') slug: string,
    @Query('table') tableId?: string,
    @Query('venue') venueId?: string,
  ) {
    return this.publicService.findMenuByOrganizationAndTable(slug, tableId, venueId);
  }

  @Post('qrcodes/:id/scan')
  @Public()
  @ApiOperation({ summary: 'Record a QR code scan' })
  @ApiParam({ name: 'id', description: 'QR code ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The QR code scan has been successfully recorded.',
    type: QrCodeEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'QR code not found.',
  })
  recordScan(
    @Param('id') id: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.publicService.recordScan(id, ip, userAgent);
  }

  @Post('orders')
  @Public()
  @ApiOperation({ summary: 'Create a public order' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid order data',
  })
  async createOrder(@Body() publicOrderDto: CreatePublicOrderDto) {
    try {
      // Validate the order data
      if (!publicOrderDto.tableId && !publicOrderDto.roomNumber) {
        throw new BadRequestException(
          'Either tableId or roomNumber is required',
        );
      }

      if (!publicOrderDto.items || publicOrderDto.items.length === 0) {
        throw new BadRequestException('Order must have at least one item');
      }

      // For public orders, we use a special system user ID
      const systemUserId = 'system';

      // If tableId is provided, get the venueId from the table
      let venueId = publicOrderDto.venueId;
      if (publicOrderDto.tableId && !venueId) {
        try {
          const table = await this.prisma.table.findUnique({
            where: { id: publicOrderDto.tableId },
            select: { venueId: true },
          });

          if (!table) {
            throw new NotFoundException(`Table with ID ${publicOrderDto.tableId} not found`);
          }

          venueId = table.venueId;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw new BadRequestException('Failed to retrieve venue from table');
        }
      }

      // Convert to CreateOrderDto
      const createOrderDto: CreateOrderDto = {
        venueId: venueId as string, // We know it's defined at this point
        tableId: publicOrderDto.tableId,
        customerName: publicOrderDto.customerName,
        customerEmail: publicOrderDto.customerEmail,
        customerPhone: publicOrderDto.customerPhone,
        roomNumber: publicOrderDto.roomNumber,
        partySize: publicOrderDto.partySize,
        notes: publicOrderDto.notes,
        items: publicOrderDto.items,
        status: publicOrderDto.status,
      };

      // Create the order
      const order = await this.ordersService.create(createOrderDto, systemUserId);
      return order;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create order');
    }
  }



  @Post('venues/:venueId/orders')
  @Public()
  @ApiOperation({ summary: 'Create a public order for a specific venue' })
  @ApiParam({ name: 'venueId', description: 'Venue ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid order data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venue not found',
  })
  async createOrderForVenue(
    @Param('venueId') venueId: string,
    @Body() publicOrderDto: CreatePublicOrderDto,
  ) {
    try {
      // For public orders, we use a special system user ID
      const systemUserId = 'system';

      // Check if venue exists
      try {
        // We'll try to get the venue directly from Prisma instead of using the service
        // since the service requires authentication
        const venue = await this.prisma.venue.findUnique({
          where: { id: venueId },
        });

        if (!venue) {
          throw new NotFoundException('Venue not found');
        }
      } catch (error) {
        throw new NotFoundException('Venue not found');
      }

      // Validate the order data
      if (!publicOrderDto.tableId && !publicOrderDto.roomNumber) {
        throw new BadRequestException(
          'Either tableId or roomNumber is required',
        );
      }

      if (!publicOrderDto.items || publicOrderDto.items.length === 0) {
        throw new BadRequestException('Order must have at least one item');
      }

      // If tableId is provided, check if it belongs to the venue
      if (publicOrderDto.tableId) {
        // Check directly with Prisma
        const table = await this.prisma.table.findUnique({
          where: {
            id: publicOrderDto.tableId,
            venueId: venueId
          },
        });

        if (!table) {
          throw new BadRequestException('Table does not belong to this venue');
        }
      }

      // Check table ordering restrictions if customer phone is provided
      if (publicOrderDto.customerPhone && publicOrderDto.tableId) {
        const activeOrders = await this.prisma.order.findMany({
          where: {
            customerPhone: publicOrderDto.customerPhone,
            status: {
              in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED']
            },
            paymentStatus: { not: 'PAID' }
          },
          include: {
            table: {
              include: {
                venue: true
              }
            }
          }
        });

        // Check if customer has active orders on different tables
        const differentTableOrders = activeOrders.filter(order => order.tableId !== publicOrderDto.tableId);
        if (differentTableOrders.length > 0) {
          const tableNames = [...new Set(differentTableOrders.map(order => order.table?.name).filter(Boolean))];
          const tableNamesStr = tableNames.length === 1 ? tableNames[0] : `${tableNames.slice(0, -1).join(', ')} and ${tableNames[tableNames.length - 1]}`;
          throw new BadRequestException(
            `You have an active order at ${tableNamesStr}. Please complete and pay for your current order before ordering from another table.`
          );
        }
      }

      // Convert to CreateOrderDto
      const createOrderDto: CreateOrderDto = {
        venueId: venueId,
        tableId: publicOrderDto.tableId,
        customerName: publicOrderDto.customerName,
        customerEmail: publicOrderDto.customerEmail,
        customerPhone: publicOrderDto.customerPhone,
        roomNumber: publicOrderDto.roomNumber,
        partySize: publicOrderDto.partySize,
        notes: publicOrderDto.notes,
        items: publicOrderDto.items,
        status: publicOrderDto.status,
      };

      // Create the order
      const order = await this.ordersService.create(createOrderDto, systemUserId);
      return order;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create order');
    }
  }

  @Get('orders/:orderId/status')
  @Public()
  @ApiOperation({ summary: 'Get public order status' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order status found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  async getOrderStatus(@Param('orderId') orderId: string) {
    try {
      // For public access, we'll use Prisma directly instead of the service
      // which requires authentication
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          createdAt: true,
          completedAt: true,
          tableId: true,
          totalAmount: true,
          customerName: true,
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
          table: {
            select: {
              name: true,
              venueId: true,
              venue: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      return order;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get order status');
    }
  }

  @Get('customers/search/:phoneNumber')
  @Public()
  @ApiOperation({ summary: 'Search customer by phone number and check ordering restrictions' })
  @ApiParam({ name: 'phoneNumber', description: 'Customer phone number' })
  @ApiQuery({ name: 'tableId', description: 'Current table ID to check restrictions against', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns customer profile and ordering restrictions.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid phone number.',
  })
  async searchCustomerByPhone(
    @Param('phoneNumber') phoneNumber: string,
    @Query('tableId') tableId?: string
  ) {
    try {
      // Find the most recent order with customer details
      const recentOrder = await this.prisma.order.findFirst({
        where: {
          customerPhone: phoneNumber,
          customerName: { not: null }
        },
        select: {
          customerName: true,
          customerEmail: true,
          customerPhone: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Find active orders (not completed and paid)
      const activeOrders = await this.prisma.order.findMany({
        where: {
          customerPhone: phoneNumber,
          status: {
            in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED']
          },
          paymentStatus: { not: 'PAID' }
        },
        include: {
          table: {
            include: {
              venue: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Check if customer can order based on table restrictions
      let canOrder = true;
      let restrictionMessage: string | undefined = undefined;

      if (activeOrders.length > 0 && tableId) {
        // Check if any active orders are from different tables
        const differentTableOrders = activeOrders.filter(order => order.tableId !== tableId);
        const sameTableOrders = activeOrders.filter(order => order.tableId === tableId);

        if (differentTableOrders.length > 0) {
          // Customer has active orders on different tables - restrict ordering
          canOrder = false;
          const tableNames = [...new Set(differentTableOrders.map(order => order.table?.name).filter(Boolean))];
          if (tableNames.length === 1) {
            restrictionMessage = `You have an active order at ${tableNames[0]}. Please complete and pay for your current order before ordering from another table.`;
          } else {
            restrictionMessage = `You have active orders at multiple tables (${tableNames.join(', ')}). Please complete and pay for your current orders before placing new orders.`;
          }
        } else if (sameTableOrders.length > 0) {
          // Customer has active orders on the same table - allow ordering (adding to existing order)
          canOrder = true;
          const tableName = sameTableOrders[0].table?.name || 'this table';
          restrictionMessage = `You have an active order at ${tableName}. You can continue adding items to your order.`;
        }
      } else if (activeOrders.length > 0 && !tableId) {
        // No table context provided, show general message
        canOrder = false;
        const tableNames = [...new Set(activeOrders.map(order => order.table?.name).filter(Boolean))];
        if (tableNames.length === 1) {
          restrictionMessage = `You have an active order at ${tableNames[0]}. Please complete and pay for your current order before ordering from another table.`;
        } else {
          restrictionMessage = `You have active orders at multiple tables. Please complete and pay for your current orders before placing new orders.`;
        }
      }

      return {
        found: !!recentOrder,
        customer: recentOrder ? {
          name: recentOrder.customerName,
          email: recentOrder.customerEmail || '',
          phone: recentOrder.customerPhone
        } : null,
        activeOrders: activeOrders.map(order => ({
          orderId: order.id,
          tableId: order.tableId,
          tableName: order.table?.name || 'Unknown Table',
          venueName: order.table?.venue?.name || 'Unknown Venue',
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt.toISOString(),
          totalAmount: order.totalAmount
        })),
        canOrder,
        restrictionMessage
      };
    } catch (error) {
      throw new BadRequestException('Failed to search customer by phone number');
    }
  }

  @Get('customers/:phoneNumber/can-order-from-table/:tableId')
  @Public()
  @ApiOperation({ summary: 'Check if customer can order from specific table' })
  @ApiParam({ name: 'phoneNumber', description: 'Customer phone number' })
  @ApiParam({ name: 'tableId', description: 'Table ID to check' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns whether customer can order from the specified table.',
  })
  async canOrderFromTable(
    @Param('phoneNumber') phoneNumber: string,
    @Param('tableId') tableId: string
  ) {
    try {
      // Find active orders for this customer
      const activeOrders = await this.prisma.order.findMany({
        where: {
          customerPhone: phoneNumber,
          status: {
            in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED']
          },
          paymentStatus: { not: 'PAID' }
        },
        include: {
          table: {
            include: {
              venue: true
            }
          }
        }
      });

      if (activeOrders.length === 0) {
        return {
          canOrder: true,
          reason: 'NO_RESTRICTIONS',
          requiresConfirmation: false
        };
      }

      // Check if customer has active order on the same table
      const sameTableOrder = activeOrders.find(order => order.tableId === tableId);
      if (sameTableOrder) {
        return {
          canOrder: true,
          reason: 'ACTIVE_ORDER_SAME_TABLE',
          activeOrder: {
            orderId: sameTableOrder.id,
            tableId: sameTableOrder.tableId,
            tableName: sameTableOrder.table?.name || 'Unknown Table',
            status: sameTableOrder.status,
            paymentStatus: sameTableOrder.paymentStatus
          },
          requiresConfirmation: false
        };
      }

      // Customer has active orders on different tables
      const differentTableOrder = activeOrders[0]; // Get the first active order
      return {
        canOrder: false,
        reason: 'ACTIVE_ORDER_DIFFERENT_TABLE',
        activeOrder: {
          orderId: differentTableOrder.id,
          tableId: differentTableOrder.tableId,
          tableName: differentTableOrder.table?.name || 'Unknown Table',
          status: differentTableOrder.status,
          paymentStatus: differentTableOrder.paymentStatus
        },
        requiresConfirmation: true
      };
    } catch (error) {
      throw new BadRequestException('Failed to check table ordering permissions');
    }
  }

  @Get('orders/phone/:phoneNumber')
  @Public()
  @ApiOperation({ summary: 'Get orders by phone number' })
  @ApiParam({ name: 'phoneNumber', description: 'Customer phone number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orders found',
  })
  async getOrdersByPhone(@Param('phoneNumber') phoneNumber: string) {
    try {
      // For public access, we'll use Prisma directly
      const orders = await this.prisma.order.findMany({
        where: {
          customerPhone: phoneNumber
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          createdAt: true,
          completedAt: true,
          tableId: true,
          totalAmount: true,
          customerName: true,
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
          table: {
            select: {
              name: true,
              venueId: true,
              venue: {
                select: {
                  name: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5 // Limit to the 5 most recent orders
      });

      return orders;
    } catch (error) {
      throw new BadRequestException('Failed to get orders by phone number');
    }
  }
}
