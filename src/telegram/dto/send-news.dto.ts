import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendNewsDto {
  @ApiProperty({ description: 'Telegram Chat ID của người nhận', example: '123456789' })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ description: 'Nội dung tin tức', example: 'Cập nhật tin tức thị trường hôm nay: ...' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
