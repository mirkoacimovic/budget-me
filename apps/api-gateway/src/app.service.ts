import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    @Inject('COST_SERVICE') private readonly client: ClientProxy,
  ) {}

  /**
   * Forwards cost data to the RabbitMQ queue.
   * Pattern: 'cost_uploaded'
   */
  sendCostEvent(data: any) {
    console.log(`[Gateway] Broadcasting to AI: ${data.firstName}`);
    // Using emit for asynchronous event-based communication
    return this.client.emit('cost_uploaded', data);
  }
}