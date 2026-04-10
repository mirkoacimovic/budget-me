import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' }, // Allow React to connect
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('DashboardGateway');

  handleConnection(client: Socket) {
    this.logger.log(`--- 🌐 BROWSER CONNECTED: ${client.id} ---`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`--- 🌐 BROWSER DISCONNECTED: ${client.id} ---`);
  }

  // This method is called by the AppController when RabbitMQ receives data
  sendAiUpdate(data: any) {
    this.server.emit('ai_update', data);
  }
}