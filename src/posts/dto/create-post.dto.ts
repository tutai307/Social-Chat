import { IsString, IsNotEmpty, IsArray, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'Hôm nay trời đẹp quá!', description: 'Nội dung của bài viết' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: ['https://example.com/image.jpg'],
    description: 'Danh sách URL hình ảnh đính kèm',
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsUrl({}, { each: true })
  images?: string[];
}
