import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'Địa chỉ email của người dùng' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123', description: 'Mật khẩu (tối thiểu 6 ký tự)', minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên đầy đủ' })
    @IsString()
    @IsNotEmpty()
    fullName: string;
}
