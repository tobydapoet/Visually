import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { eurekaClient } from './euruka.client';

@Injectable()
export class EurekaService implements OnModuleInit, OnModuleDestroy {
  onModuleInit() {
    eurekaClient.start((error) => {
      if (error) {
        console.error('Eureka register failed', error);
      } else {
        console.log('Eureka registered');
      }
    });
  }

  onModuleDestroy() {
    eurekaClient.stop();
  }
}
