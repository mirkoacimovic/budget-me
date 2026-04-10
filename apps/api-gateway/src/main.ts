import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS so your Dashboard can actually talk to the Gateway
  app.enableCors();

  // Connect to AI Results Exchange
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      // FIX: Changed 'localhost' to 'rabbitmq'
      urls: [process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672'],
      queue: 'ai_dashboard_queue',
      queueOptions: { durable: false },
      exchange: 'ai_results_exchange',
      exchangeType: 'fanout',
      exchangeOptions: { durable: true }
    },
  });

  await app.startAllMicroservices();
  
  // Docker-friendly: listen on 0.0.0.0
  await app.listen(3000, '0.0.0.0');
  
  console.log('🚀 API Gateway & AI Listener Active on Port 3000');
}
bootstrap();