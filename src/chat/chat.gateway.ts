import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization;
      if (!token) return client.disconnect();

      const payload = await this.jwtService.verifyAsync(token.replace('Bearer ', ''));
      const userId = payload.sub;

      if (userId) {
        client.data.userId = userId;
        client.join(`user_${userId}`);
        this.logger.log(`User ${userId} connected to ChatGateway`);
      }
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    // Kiểm tra xem user có thuộc conversation này không
    const isMember = await this.chatService.isMember(client.data.userId, conversationId);
    if (isMember) {
      client.join(`conv_${conversationId}`);
      this.logger.log(`User ${client.data.userId} joined conversation room: ${conversationId}`);
    }
  }

  sendNewMessage(conversationId: string, message: any) {
    this.server.to(`conv_${conversationId}`).emit('new_message', message);
  }
}
