import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Nguyễn Văn B', description: 'Họ và tên mới', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'Yêu lập trình và chia sẻ kiến thức', description: 'Tiểu sử cá nhân', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', description: 'URL ảnh đại diện', required: false })
  @IsUrl()
  @IsOptional()
  avatar?: string;
}
