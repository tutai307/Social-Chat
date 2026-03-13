import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TelegramSubscriber extends Document {
  @Prop({ required: true, unique: true })
  chatId: string;

  @Prop()
  username?: string;

  @Prop()
  firstName?: string;
  
  @Prop()
  lastName?: string;
}

export const TelegramSubscriberSchema = SchemaFactory.createForClass(TelegramSubscriber);
