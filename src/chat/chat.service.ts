import { Injectable, ForbiddenException, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument, ConversationType } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { FriendshipsService } from '../friendships/friendships.service';

import { EncryptionService } from './encryption.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @Inject(forwardRef(() => FriendshipsService))
    private friendshipsService: FriendshipsService,
    private encryptionService: EncryptionService,
  ) {}

  async createConversation(userId: string, memberIds: string[], type: ConversationType, name?: string) {
    // Chỉ bạn bè mới được nhắn 1:1
    if (type === ConversationType.PRIVATE) {
      if (memberIds.length !== 1) {
          throw new ForbiddenException('Chat 1:1 chỉ được có 2 người');
      }
      const friendId = memberIds[0];
      const status = await this.friendshipsService.getFriendshipStatus(userId, friendId);
      if (status !== 'friends') {
        throw new ForbiddenException('Chỉ có thể nhắn tin cho bạn bè');
      }

      // Kiểm tra xem đã có conversation 1:1 chưa
      const existing = await this.conversationModel.findOne({
        type: ConversationType.PRIVATE,
        members: { $all: [new Types.ObjectId(userId), new Types.ObjectId(friendId)] },
      });
      if (existing) return existing;
    }

    // Chỉ bạn bè mới được thêm vào group
    if (type === ConversationType.GROUP) {
      for (const mId of memberIds) {
        const status = await this.friendshipsService.getFriendshipStatus(userId, mId);
        if (status !== 'friends') {
          throw new ForbiddenException(`Chỉ có thể thêm bạn bè vào nhóm. ID ${mId} không phải bạn bè.`);
        }
      }
    }

    const members = [new Types.ObjectId(userId), ...memberIds.map(id => new Types.ObjectId(id))];
    const conversation = new this.conversationModel({
      name,
      type,
      members,
      admins: [new Types.ObjectId(userId)],
    });

    return conversation.save();
  }

  async getConversations(userId: string) {
    const conversations = await this.conversationModel
      .find({ members: new Types.ObjectId(userId) })
      .populate('members', 'fullName avatar')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'fullName avatar' }
      })
      .sort({ updatedAt: -1 })
      .exec();

    return conversations.map(conv => {
      const obj = conv.toObject() as any;
      if (obj.lastMessage && obj.lastMessage.content) {
        try {
          obj.lastMessage.content = this.encryptionService.decrypt(obj.lastMessage.content);
        } catch (e) {
          obj.lastMessage.content = '[Encrypted Message]';
        }
      }
      return obj;
    });
  }

  async sendMessage(userId: string, conversationId: string, content: string, type = 'text') {
    const isMember = await this.isMember(userId, conversationId);
    if (!isMember) {
      throw new ForbiddenException('Bạn không thuộc cuộc hội thoại này');
    }

    const encryptedContent = this.encryptionService.encrypt(content);

    const message = new this.messageModel({
      conversation: new Types.ObjectId(conversationId),
      sender: new Types.ObjectId(userId),
      content: encryptedContent,
      type,
    });

    const savedMessage = await message.save();
    
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: savedMessage._id,
    });

    const populatedMessage = await savedMessage.populate('sender', 'fullName avatar');
    const result = populatedMessage.toObject();
    result.content = this.encryptionService.decrypt(result.content);
    return result;
  }

  async getMessages(conversationId: string, userId: string, limit = 50, offset = 0) {
    const isMember = await this.isMember(userId, conversationId);
    if (!isMember) {
      throw new ForbiddenException('Bạn không thuộc cuộc hội thoại này');
    }

    const messages = await this.messageModel
      .find({ conversation: new Types.ObjectId(conversationId) })
      .populate('sender', 'fullName avatar')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();

    return messages.map(msg => {
      const obj = msg.toObject();
      obj.content = this.encryptionService.decrypt(obj.content);
      return obj;
    });
  }

  async isMember(userId: string, conversationId: string): Promise<boolean> {
    const count = await this.conversationModel.countDocuments({
      _id: new Types.ObjectId(conversationId),
      members: new Types.ObjectId(userId),
    });
    return count > 0;
  }
}
