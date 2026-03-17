import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // FE có thể gửi token qua query, auth object hoặc headers
      let token = client.handshake.auth?.token || client.handshake.headers?.authorization;
      
      // Nếu không có token ở trên, thử query (fallback)
      if (!token) {
        token = client.handshake.query?.token as string;
      }

      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        // Khách (anonymous) vẫn có thể kết nối nhưng không vào room cá nhân
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      if (userId) {
        client.join(userId);
        this.logger.log(`Client ${client.id} authenticated. User ID: ${userId} joined room.`);
      }
    } catch (error) {
      this.logger.error(`Authentication error for client ${client.id}: ${error.message}`);
      // Không ngắt kết nối, chỉ không join room
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.logger.log(`Emitting 'new_notification' to room: ${userId}`);
    this.server.to(userId).emit('new_notification', notification);
  }
}
