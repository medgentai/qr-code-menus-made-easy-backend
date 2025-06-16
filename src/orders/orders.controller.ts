import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpStatus,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { MarkOrderPaidDto, MarkOrderUnpaidDto, PaymentStatusResponse } from './dto/mark-order-paid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { OrderStatus } from '@prisma/client';
import { PaginatedOrdersResponseDto } from './dto/paginated-orders-response.dto';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The order has been successfully created.',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: RequestWithUser) {
    return this.ordersService.create(createOrderDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated orders that match the filter criteria.',
    type: PaginatedOrdersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  findAll(@Query() filterDto: FilterOrdersDto, @Req() req: RequestWithUser) {
    return this.ordersService.findAll(filterDto, req.user.id);
  }

  @Get('/filtered')
  @ApiOperation({ summary: 'Get orders with combined filtering (organization, venue, status)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated orders that match all filter criteria.',
    type: PaginatedOrdersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - user does not have access to the organization or venue.',
  })
  findFiltered(@Query() filterDto: FilterOrdersDto, @Req() req: RequestWithUser) {
    return this.ordersService.findFiltered(filterDto, req.user.id);
  }

  @Get('venue/:venueId')
  @ApiOperation({ summary: 'Get all orders for a venue with pagination' })
  @ApiParam({ name: 'venueId', description: 'Venue ID' })
  @ApiQuery({ name: 'page', description: 'Page number (1-based)', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, type: Number })
  @ApiQuery({ name: 'status', description: 'Filter by order status', required: false, enum: OrderStatus })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated orders for the venue.',
    type: PaginatedOrdersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  findAllForVenue(
    @Param('venueId') venueId: string,
    @Req() req: RequestWithUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAllForVenue(
      venueId,
      req.user.id,
      page ? parseInt(page as any) : undefined,
      limit ? parseInt(limit as any) : undefined,
      status
    );
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Get all orders for an organization with pagination' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiQuery({ name: 'page', description: 'Page number (1-based)', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, type: Number })
  @ApiQuery({ name: 'status', description: 'Filter by order status', required: false, enum: OrderStatus })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated orders for the organization.',
    type: PaginatedOrdersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  findAllForOrganization(
    @Param('organizationId') organizationId: string,
    @Req() req: RequestWithUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAllForOrganization(
      organizationId,
      req.user.id,
      page ? parseInt(page as any) : undefined,
      limit ? parseInt(limit as any) : undefined,
      status
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the order.',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The order has been successfully updated.',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ordersService.update(id, updateOrderDto, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update an order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The order status has been successfully updated.',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Req() req: RequestWithUser,
  ) {
    if (!status || !Object.values(OrderStatus).includes(status)) {
      throw new BadRequestException(`Invalid order status: ${status}`);
    }

    return this.ordersService.update(id, { status }, req.user.id);
  }

  @Patch(':orderId/items/:itemId')
  @ApiOperation({ summary: 'Update an order item' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiParam({ name: 'itemId', description: 'Order Item ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The order item has been successfully updated.',
    type: OrderItemEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order or order item not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  updateOrderItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() updateOrderItemDto: UpdateOrderItemDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ordersService.updateOrderItem(
      orderId,
      itemId,
      updateOrderItemDto,
      req.user.id,
    );
  }

  @Patch(':id/payment/mark-paid')
  @ApiOperation({ summary: 'Mark an order as paid' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The order has been successfully marked as paid.',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request - payment amount mismatch.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  markOrderAsPaid(
    @Param('id') id: string,
    @Body() markOrderPaidDto: MarkOrderPaidDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ordersService.markOrderAsPaid(id, markOrderPaidDto, req.user.id);
  }

  @Patch(':id/payment/mark-unpaid')
  @ApiOperation({ summary: 'Mark an order as unpaid' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The order has been successfully marked as unpaid.',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  markOrderAsUnpaid(
    @Param('id') id: string,
    @Body() markOrderUnpaidDto: MarkOrderUnpaidDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ordersService.markOrderAsUnpaid(id, markOrderUnpaidDto, req.user.id);
  }

  @Get(':id/payment-status')
  @ApiOperation({ summary: 'Get payment status for an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the payment status of the order.',
    type: PaymentStatusResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  getOrderPaymentStatus(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.ordersService.getOrderPaymentStatus(id, req.user.id);
  }

  @Get('venue/:venueId/unpaid')
  @ApiOperation({ summary: 'Get all unpaid orders for a venue' })
  @ApiParam({ name: 'venueId', description: 'Venue ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all unpaid orders for the venue.',
    type: [OrderEntity],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  getUnpaidOrders(
    @Param('venueId') venueId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.ordersService.getUnpaidOrders(venueId, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The order has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.ordersService.remove(id, req.user.id);
  }
}
