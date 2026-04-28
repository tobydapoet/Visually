import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  private readonly logger = new Logger(SocketGateway.name);

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      client.disconnect();
      return;
    }
    client.join(`user:${userId}`);
    this.kafkaClient.emit('user.status.changed', { userId, lastSeen: null });
    this.logger.log(`User ${userId} connected`);
    client.emit('connected', { userId });
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.kafkaClient.emit('user.status.changed', {
      userId,
      lastSeen: new Date(),
    });
    this.logger.log(`User ${userId} disconnected`);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.log(`Client joined conversation:${data.conversationId}`);
  }

  sendMessage(event: any) {
    const mutedUserIds: string[] = event.mutedUserIds ?? [];
    const mentionedUserIds: string[] =
      event.mentions?.map((m: any) => m.userId) ?? [];

    const actualMutedIds = mutedUserIds.filter(
      (id) => !mentionedUserIds.includes(id),
    );

    this.server
      .to(`conversation:${event.conversationId}`)
      .except(actualMutedIds.map((id) => `user:${id}`))
      .emit('new_message', event);
  }

  updateMessage(event: any) {
    this.server
      .to(`conversation:${event.conversationId}`)
      .emit('message_updated', event);
  }

  deleteMessage(event: any) {
    this.server
      .to(`conversation:${event.conversationId}`)
      .emit('message_deleted', {
        messageId: event.id,
        conversationId: event.conversationId,
      });
  }

  sendNotification(event: any) {
    if (event.senderId && event.senderId === event.userId) return;
    this.server.to(`user:${event.userId}`).emit('new_notification', event);
  }

  joinConversation(userId: string, conversationId: string) {
    this.server
      .in(`user:${userId}`)
      .socketsJoin(`conversation:${conversationId}`);
  }

  emitAdPayment(userId: string, event: any) {
    this.server.to(`user:${userId}`).emit('ad_register', event);
  }
}
