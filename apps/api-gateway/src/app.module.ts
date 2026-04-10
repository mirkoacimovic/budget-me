import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { DashboardGateway } from './gateways/dashboard.gateway';
import { BudgetAuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', 
    }),
    ClientsModule.registerAsync([
      {
        name: 'COST_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rmqUrl = configService.get<string>('RABBITMQ_URL') || 'amqp://rabbitmq:5672';
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rmqUrl],
              queue: 'cost_queue',
              queueOptions: { durable: true },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AppController, AuthController], // <-- AuthController must be here
  providers: [AppService, AuthService, DashboardGateway, BudgetAuthGuard], // <-- AuthService must be here
})
export class AppModule {}