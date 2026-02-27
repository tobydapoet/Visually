import { Test, TestingModule } from '@nestjs/testing';
import { KafkaConsumerController } from './kafka-consumer.controller';

describe('KafkaConsumerController', () => {
  let controller: KafkaConsumerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KafkaConsumerController],
    }).compile();

    controller = module.get<KafkaConsumerController>(KafkaConsumerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
