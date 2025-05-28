import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable, UseGuards } from '@nestjs/common';
import { OrderStatus, OrderItemStatus } from '@prisma/client';
import { WsOptionalJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';

export interface OrderEvent {
  orderId: string;
  status: OrderStatus;
  tableId?: string;
  venueId?: string;
  organizationId?: string;
  timestamp: Date;
  message: string;
}

export interface OrderItemEvent {
  orderId: string;
  orderItemId: string;
  status: OrderItemStatus;
  timestamp: Date;
  message: string;
}

@Injectable()
@UseGuards(WsOptionalJwtAuthGuard)
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: 'orders',
})
export class OrderEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger('OrderEventsGateway');

  // Room names are constructed as:
  // - organization:{organizationId} - for all orders in an organization
  // - venue:{venueId} - for all orders in a venue
  // - table:{tableId} - for all orders at a specific table
  // - order:{orderId} - for a specific order

  afterInit(server: Server) {
    this.logger.log('Order Events WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Helper method to check if client can join restricted rooms
  private canJoinRestrictedRoom(client: Socket): boolean {
    return !client.data.isPublic && !!client.data.user;
  }

  // Helper method to log room joins
  private logRoomJoin(client: Socket, room: string, allowed: boolean) {
    const user = client.data.user;
    const isPublic = client.data.isPublic;

    if (allowed) {
      if (isPublic) {
        this.logger.log(`Public client joined room: ${room}`);
      } else {
        this.logger.log(`Client (User: ${user?.email}) joined room: ${room}`);
      }
    } else {
      this.logger.warn(`Client denied access to room: ${room} (public user)`);
    }
  }

  @SubscribeMessage('joinOrderRoom')
  handleJoinOrderRoom(client: Socket, orderId: string): WsResponse<string> {
    const room = `order:${orderId}`;
    client.join(room);
    this.logRoomJoin(client, room, true);
    return { event: 'joinedRoom', data: room };
  }

  @SubscribeMessage('joinVenueRoom')
  handleJoinVenueRoom(client: Socket, venueId: string): WsResponse<string> {
    const room = `venue:${venueId}`;

    // Check if client can join restricted room
    if (!this.canJoinRestrictedRoom(client)) {
      this.logRoomJoin(client, room, false);
      return { event: 'error', data: 'Authentication required to join venue room' };
    }

    client.join(room);
    this.logRoomJoin(client, room, true);
    return { event: 'joinedRoom', data: room };
  }

  @SubscribeMessage('joinTableRoom')
  handleJoinTableRoom(client: Socket, tableId: string): WsResponse<string> {
    const room = `table:${tableId}`;
    client.join(room);
    this.logRoomJoin(client, room, true);
    return { event: 'joinedRoom', data: room };
  }

  @SubscribeMessage('joinOrganizationRoom')
  handleJoinOrganizationRoom(
    client: Socket,
    organizationId: string,
  ): WsResponse<string> {
    const room = `organization:${organizationId}`;

    // Check if client can join restricted room
    if (!this.canJoinRestrictedRoom(client)) {
      this.logRoomJoin(client, room, false);
      return { event: 'error', data: 'Authentication required to join organization room' };
    }

    client.join(room);
    this.logRoomJoin(client, room, true);
    return { event: 'joinedRoom', data: room };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string): WsResponse<string> {
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    return { event: 'leftRoom', data: room };
  }

  // Method to emit order events
  emitOrderEvent(event: OrderEvent) {
    // Emit to specific order room
    this.server.to(`order:${event.orderId}`).emit('orderUpdated', event);

    // If table ID is provided, emit to table room
    if (event.tableId) {
      this.server.to(`table:${event.tableId}`).emit('orderUpdated', event);
    }

    // If venue ID is provided, emit to venue room
    if (event.venueId) {
      this.server.to(`venue:${event.venueId}`).emit('orderUpdated', event);
    }

    // If organization ID is provided, emit to organization room
    if (event.organizationId) {
      this.server
        .to(`organization:${event.organizationId}`)
        .emit('orderUpdated', event);
    }

    this.logger.log(
      `Emitted order event for order ${event.orderId} with status ${event.status}`,
    );
  }

  // Method to emit order item events
  emitOrderItemEvent(event: OrderItemEvent) {
    this.server.to(`order:${event.orderId}`).emit('orderItemUpdated', event);
    this.logger.log(
      `Emitted order item event for item ${event.orderItemId} with status ${event.status}`,
    );
  }

  // Method to emit new order event
  emitNewOrder(event: OrderEvent) {
    // Emit to venue room
    if (event.venueId) {
      this.server.to(`venue:${event.venueId}`).emit('newOrder', event);
    }

    // Emit to organization room
    if (event.organizationId) {
      this.server
        .to(`organization:${event.organizationId}`)
        .emit('newOrder', event);
    }

    this.logger.log(`Emitted new order event for order ${event.orderId}`);
  }
}
