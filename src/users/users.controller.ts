import { Controller, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Patch('profile')
    @ApiOperation({ summary: 'Cập nhật thông tin profile người dùng' })
    @UseGuards(JwtAuthGuard)
    async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
        return this.usersService.update(req.user.userId, updateProfileDto);
    }
}
