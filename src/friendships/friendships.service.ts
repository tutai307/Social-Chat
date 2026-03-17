import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Friendship, FriendshipDocument, FriendshipStatus } from './schemas/friendship.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class FriendshipsService {
    constructor(
        @InjectModel(Friendship.name) private friendshipModel: Model<FriendshipDocument>,
        @InjectModel(User.name) private userModel: Model<User>,
        private notificationsService: NotificationsService,
    ) {}

    async sendFriendRequest(requesterId: string, recipientId: string): Promise<Friendship> {
        if (requesterId === recipientId) {
            throw new BadRequestException('Không thể gửi lời mời kết bạn cho chính mình');
        }

        const existingFriendship = await this.friendshipModel.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId },
            ],
        } as any);

        if (existingFriendship) {
            throw new BadRequestException('Đã có mối quan hệ kết bạn từ trước');
        }

        const newFriendship = new this.friendshipModel({
            requester: new Types.ObjectId(requesterId),
            recipient: new Types.ObjectId(recipientId),
            status: FriendshipStatus.PENDING,
        });

        const savedFriendship = await newFriendship.save();

        // Gửi thông báo lời mời kết bạn
        const requester = await this.userModel.findById(requesterId).select('fullName avatar').exec();
        await this.notificationsService.createAndNotify({
            recipient: recipientId,
            issuer: {
                _id: requesterId,
                fullName: requester?.fullName || 'Người dùng',
                avatar: requester?.avatar || '',
            },
            type: 'friend_request',
        });

        return savedFriendship;
    }

    async acceptFriendRequest(recipientId: string, requesterId: string): Promise<Friendship> {
        const friendship = await this.friendshipModel.findOne({
            requester: requesterId,
            recipient: recipientId,
            status: FriendshipStatus.PENDING,
        } as any);

        if (!friendship) {
            throw new NotFoundException('Không tìm thấy lời mời kết bạn này');
        }

        friendship.status = FriendshipStatus.ACCEPTED;
        const savedFriendship = await friendship.save();

        // Gửi thông báo chấp nhận kết bạn
        const recipient = await this.userModel.findById(recipientId).select('fullName avatar').exec();
        await this.notificationsService.createAndNotify({
            recipient: requesterId,
            issuer: {
                _id: recipientId,
                fullName: recipient?.fullName || 'Người dùng',
                avatar: recipient?.avatar || '',
            },
            type: 'friend_accept',
        });

        return savedFriendship;
    }

    async rejectFriendRequest(recipientId: string, requesterId: string): Promise<{ message: string }> {
        const result = await this.friendshipModel.deleteOne({
            requester: requesterId,
            recipient: recipientId,
            status: FriendshipStatus.PENDING,
        } as any);

        if (result.deletedCount === 0) {
            throw new NotFoundException('Không tìm thấy lời mời kết bạn này');
        }

        return { message: 'Đã từ chối lời mời kết bạn' };
    }

    async removeFriendship(userId1: string, userId2: string): Promise<{ message: string }> {
        const result = await this.friendshipModel.deleteOne({
            $or: [
                { requester: userId1, recipient: userId2 },
                { requester: userId2, recipient: userId1 },
            ],
        } as any);

        if (result.deletedCount === 0) {
            throw new NotFoundException('Không tìm thấy quan hệ kết bạn');
        }

        return { message: 'Đã hủy kết bạn hoặc thu hồi lời mời' };
    }

    async getFriendsList(userId: string): Promise<any[]> {
        const friendships = await this.friendshipModel
            .find({
                $or: [{ requester: userId }, { recipient: userId }],
                status: FriendshipStatus.ACCEPTED,
            } as any)
            .populate('requester', 'fullName email avatar')
            .populate('recipient', 'fullName email avatar')
            .exec();

        return friendships.map((f: any) => {
            const friend = f.requester._id.toString() === userId ? f.recipient : f.requester;
            return {
                friendshipId: f._id,
                friend,
                createdAt: f.createdAt,
            };
        });
    }

    async getPendingRequests(userId: string): Promise<any[]> {
        const requests = await this.friendshipModel
            .find({
                recipient: userId,
                status: FriendshipStatus.PENDING,
            } as any)
            .populate('requester', 'fullName email avatar')
            .exec();

        return requests.map((req: any) => ({
            friendshipId: req._id,
            requester: req.requester,
            createdAt: req.createdAt,
        }));
    }

    async getFriendshipStatus(userAId: string, userBId: string): Promise<'none' | 'pending' | 'friends' | 'self'> {
        if (userAId === userBId) return 'self';

        const friendship = await this.friendshipModel.findOne({
            $or: [
                { requester: userAId, recipient: userBId },
                { requester: userBId, recipient: userAId },
            ],
        } as any);

        if (!friendship) return 'none';
        
        if (friendship.status === FriendshipStatus.ACCEPTED) return 'friends';
        
        if (friendship.status === FriendshipStatus.PENDING) {
            // we might want to know if A sent to B, or B sent to A, but a general 'pending' often suffices
            // We can return 'pending_sent' and 'pending_received' if needed, but the plan specified 'pending'
            return 'pending'; 
        }

        return 'none';
    }
}
