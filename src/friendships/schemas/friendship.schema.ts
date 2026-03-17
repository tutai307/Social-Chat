import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type FriendshipDocument = Friendship & Document;

export enum FriendshipStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Friendship {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    requester: User;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    recipient: User;

    @Prop({ type: String, enum: FriendshipStatus, default: FriendshipStatus.PENDING })
    status: FriendshipStatus;
}

export const FriendshipSchema = SchemaFactory.createForClass(Friendship);

// Compound index to ensure uniqueness of friendship request between two users
FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
