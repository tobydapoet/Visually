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
  handleAdRegistered(@Payload() message: any) {
    console.log('Kafka received:', message);
    console.log('Type:', typeof message);

    const parsed = typeof message === 'string' ? JSON.parse(message) : message;
    console.log('Parsed:', parsed);
    console.log('success:', parsed.success); // true hay false?

    this.socketGateway.emitAdPayment(parsed.userId, {
      success: parsed.success,
      message: parsed.success
        ? 'Payment successful! Your post is being boosted 🚀'
        : 'Payment failed, please try again',
    });
  }
}
