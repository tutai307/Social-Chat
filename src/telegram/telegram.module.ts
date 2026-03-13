import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramSubscriber, TelegramSubscriberSchema } from './schemas/telegram-subscriber.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN') || 'mock_token',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: TelegramSubscriber.name, schema: TelegramSubscriberSchema }]),
    HttpModule,
  ],
  providers: [TelegramService],
  controllers: [TelegramController],
})
export class TelegramModule {}
