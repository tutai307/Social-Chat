import { Controller, Post, Delete, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Friendships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendshipsController {
    constructor(private readonly friendshipsService: FriendshipsService) {}

    @Post('request/:userId')
    @ApiOperation({ summary: 'Gửi lời mời kết bạn' })
    async sendFriendRequest(@Req() req, @Param('userId') recipientId: string) {
        return this.friendshipsService.sendFriendRequest(req.user.userId, recipientId);
    }

    @Post('accept/:userId')
    @ApiOperation({ summary: 'Đồng ý lời mời kết bạn' })
    async acceptFriendRequest(@Req() req, @Param('userId') requesterId: string) {
        return this.friendshipsService.acceptFriendRequest(req.user.userId, requesterId);
    }

    @Post('reject/:userId')
    @ApiOperation({ summary: 'Từ chối lời mời kết bạn' })
    async rejectFriendRequest(@Req() req, @Param('userId') requesterId: string) {
        return this.friendshipsService.rejectFriendRequest(req.user.userId, requesterId);
    }

    @Delete(':userId')
    @ApiOperation({ summary: 'Hủy kết bạn hoặc hủy lời mời' })
    async removeFriendship(@Req() req, @Param('userId') targetUserId: string) {
        return this.friendshipsService.removeFriendship(req.user.userId, targetUserId);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách bạn bè hiện tại' })
    async getFriends(@Req() req) {
        return this.friendshipsService.getFriendsList(req.user.userId);
    }

    @Get('requests')
    @ApiOperation({ summary: 'Lấy danh sách lời mời kết bạn đang chờ' })
    async getRequests(@Req() req) {
        return this.friendshipsService.getPendingRequests(req.user.userId);
    }
}
