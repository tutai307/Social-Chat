import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createAndNotify(data: {
    recipient: string;
    issuer: { _id: string; fullName: string; avatar: string };
    type: 'like' | 'comment' | 'friend_request' | 'friend_accept';
    post?: string;
  }) {
    const notification = new this.notificationModel({
      recipient: new Types.ObjectId(data.recipient),
      issuer: {
        _id: new Types.ObjectId(data.issuer._id),
        fullName: data.issuer.fullName,
        avatar: data.issuer.avatar,
      },
      type: data.type,
      post: data.post ? new Types.ObjectId(data.post) : undefined,
    });

    const savedNotification = await notification.save();
    
    console.log(`[NotificationsService] Created notification for ${data.recipient}, type: ${data.type}`);
    
    // Phát WebSocket event
    this.notificationsGateway.sendNotificationToUser(data.recipient, savedNotification);
    
    return savedNotification;
  }

  async findAll(userId: string, limit = 20, offset = 0) {
    return this.notificationModel
      .find({ recipient: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel
      .countDocuments({
        recipient: new Types.ObjectId(userId),
        isRead: false,
      })
      .exec();
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), recipient: new Types.ObjectId(userId) },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return notification;
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { recipient: new Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );
    return { message: 'Đã đánh dấu tất cả là đã đọc' };
  }

  async delete(id: string, userId: string) {
    const result = await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(id),
      recipient: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return { message: 'Đã xóa thông báo' };
  }
}
