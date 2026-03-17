import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatGateway } from './chat.gateway';
import { ConversationType } from './schemas/conversation.schema';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Tạo cuộc hội thoại mới (1:1 hoặc nhóm)' })
  async createConversation(@Request() req, @Body() body: { memberIds: string[], type: ConversationType, name?: string }) {
    return this.chatService.createConversation(req.user.userId, body.memberIds, body.type, body.name);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lấy danh sách các cuộc hội thoại của người dùng' })
  async getConversations(@Request() req) {
    return this.chatService.getConversations(req.user.userId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Lấy danh sách tin nhắn trong một cuộc hội thoại' })
  async getMessages(
    @Param('id') id: string,
    @Request() req,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.chatService.getMessages(id, req.user.userId, +limit, +offset);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn mới' })
  async sendMessage(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { content: string, type?: string },
  ) {
    const message = await this.chatService.sendMessage(req.user.userId, id, body.content, body.type);
    
    // Phát WebSocket cho tất cả mọi người trong phòng
    this.chatGateway.sendNewMessage(id, message);
    
    return message;
  }
}
