import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { OrderEntity } from '../entities/order.entity';

export class PaginatedOrdersResponseDto extends PaginatedResponseDto<OrderEntity> {
  @ApiProperty({
    description: 'The orders for the current page',
    type: [OrderEntity],
  })
  data: OrderEntity[];
}
