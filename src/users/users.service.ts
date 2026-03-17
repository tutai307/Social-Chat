import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { FriendshipsService } from '../friendships/friendships.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @Inject(forwardRef(() => FriendshipsService)) private friendshipsService: FriendshipsService
    ) { }

    async create(userData: Partial<User>): Promise<UserDocument> {
        const newUser = new this.userModel(userData);
        return newUser.save();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async update(id: string, updateData: Partial<User>): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    async getProfileWithFriendshipStatus(targetUserId: string, currentUserId: string): Promise<any> {
        const user = await this.userModel.findById(targetUserId).select('-password').exec();
        if (!user) return null;
        
        const friendshipStatus = await this.friendshipsService.getFriendshipStatus(currentUserId, targetUserId);
        
        return {
            ...user.toObject(),
            friendshipStatus,
        };
    }
}
