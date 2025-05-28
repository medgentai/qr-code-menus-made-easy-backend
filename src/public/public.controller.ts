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

      // Convert to CreateOrderDto
      const createOrderDto: CreateOrderDto = {
        venueId: venueId,
        tableId: publicOrderDto.tableId,
        customerName: publicOrderDto.customerName,
        customerEmail: publicOrderDto.customerEmail,
        customerPhone: publicOrderDto.customerPhone,
        roomNumber: publicOrderDto.roomNumber,
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
