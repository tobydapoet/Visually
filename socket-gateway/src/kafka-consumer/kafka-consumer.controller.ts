import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SocketGateway } from 'src/socket/socket.gateway';

@Controller('kafka-consumer')
export class KafkaConsumerController {
  private readonly logger = new Logger(KafkaConsumerController.name);

  constructor(private readonly socketGateway: SocketGateway) {}

  @EventPattern('message.created')
  handleMessageCreated(@Payload() event: any) {
    this.logger.log(`📨 message.created: ${JSON.stringify(event)}`);
    this.socketGateway.sendMessage(event);
  }

  @EventPattern('message.updated')
  handleMessageUpdated(@Payload() event: any) {
    this.socketGateway.updateMessage(event);
  }

  @EventPattern('message.deleted')
  handleMessageDeleted(@Payload() event: any) {
    this.socketGateway.deleteMessage(event);
  }

  @EventPattern('notification.created')
  handleNotificationCreated(@Payload() event: any) {
    this.logger.log(`🔔 notification.created: ${JSON.stringify(event)}`);
    this.socketGateway.sendNotification(event);
  }

  @EventPattern('ad.registered.result')
  async handleAdResult(@Payload() data: { userId: string; success: boolean }) {
    this.socketGateway.emitAdPayment(data.userId, {
      success: data.success,
      message: data.success ? 'Register ad success!' : 'Register failed',
    });
  }
}
