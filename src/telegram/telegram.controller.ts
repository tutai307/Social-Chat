import { Controller, Post, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SendNewsDto } from './dto/send-news.dto';

@ApiTags('Telegram Bot')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('news')
  @ApiOperation({ summary: 'Gửi tin tức thị trường tới một Telegram Chat ID' })
  async sendNews(@Body() sendNewsDto: SendNewsDto) {
    return this.telegramService.sendNews(sendNewsDto.chatId, sendNewsDto.message);
  }
}
