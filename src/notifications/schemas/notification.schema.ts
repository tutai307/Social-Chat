import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient: Types.ObjectId;

  @Prop({
    type: {
      _id: { type: Types.ObjectId, ref: 'User' },
      fullName: String,
      avatar: String,
    },
    required: true,
  })
  issuer: {
    _id: Types.ObjectId;
    fullName: string;
    avatar: string;
  };

  @Prop({
    type: String,
    enum: ['like', 'comment', 'friend_request', 'friend_accept'],
    required: true,
  })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Post' })
  post?: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
