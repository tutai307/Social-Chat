import { Injectable, Logger } from '@nestjs/common';
import { InjectBot, Update, Start, Ctx, On } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { InjectModel } from '@nestjs/mongoose';
import { TelegramSubscriber } from './schemas/telegram-subscriber.schema';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import Parser from 'rss-parser';
import OpenAI from 'openai';

@Update()
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private sentNewsLinks = new Set<string>();

  constructor(
    @InjectBot() private bot: Telegraf<Context>,
    @InjectModel(TelegramSubscriber.name) private subscriberModel: Model<TelegramSubscriber>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    
    // Save subscriber to DB if not exists
    const existingSubscriber = await this.subscriberModel.findOne({ chatId: chatId.toString() });
    
    if (!existingSubscriber) {
      await this.subscriberModel.create({
        chatId: chatId.toString(),
        username: ctx.chat?.type === 'private' ? ctx.chat.username : undefined,
        firstName: ctx.chat?.type === 'private' ? ctx.chat.first_name : undefined,
        lastName: ctx.chat?.type === 'private' ? ctx.chat.last_name : undefined,
      });
      this.logger.log(`New subscriber joined: ${chatId}`);
    }

    this.logger.log(`Received /start from chatId: ${chatId}`);
    await ctx.reply(`Xin chào! ID Chat của bạn là: ${chatId}. Hệ thống đã ghi nhận việc bạn đăng ký nhận tin tức thị trường tự động! Mọi tin tức mới nhất về Crypto/Chứng khoán sẽ được gửi đến đây hàng ngày.`);
  }

  async sendNews(chatId: string, message: string) {
    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
      this.logger.log(`Gửi tin tức thành công đến đoạn chat: ${chatId}`);
      return { success: true, message: 'Gửi tin tức thành công' };
    } catch (error: any) {
      this.logger.error(`Lỗi khi gửi tin tức: ${error.message}`);
      throw error;
    }
  }

  @On('text')
  async onMessage(@Ctx() ctx: Context) {
    // @ts-ignore
    const text = ctx.message?.text || '';
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('tin') || lowerText.includes('hot') || lowerText.includes('news')) {
      await ctx.reply('Đang tổng hợp tin tức nóng nhất cho bạn, vui lòng đợi chút nhé... 🚀');
      try {
        const message = await this.getTopNews(false);
        if (message) {
          await ctx.replyWithHTML(message);
        } else {
          await ctx.reply('Hiện tại chưa có bản tin nào mới. Bạn thử lại sau nhé!');
        }
      } catch (error) {
        await ctx.reply('Rất tiếc, đã xảy ra lỗi khi lấy tin tức.');
      }
    } else {
      // Gọi lên OpenRouter AI để phản hồi trò chuyện tự do
      const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
      if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
        await ctx.reply('Bot hiện tại hỗ trợ gửi tin tức. Để tôi có thể trò chuyện thông minh như một AI, quản trị viên cần thiết lập OPENROUTER_API_KEY cho hệ thống nhé.');
        return;
      }

      try {
        // Gửi trạng thái đang gõ phím
        if (ctx.chat?.id) {
          await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        }
        
        const openai = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: apiKey,
          defaultHeaders: {
            "HTTP-Referer": "http://localhost:3000", // Thường yêu cầu bởi OpenRouter để tracking URL
            "X-Title": "Social Chat Telegram Bot", // Tên hiển thị trên OpenRouter cho ứng dụng này
          }
        });
        
        const currentDate = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const completion = await openai.chat.completions.create({
          model: "openrouter/auto", // Model tự động của OpenRouter (hoặc cấu hình model specifc như google/gemini-pro)
          messages: [
            { 
              role: "system", 
              content: `Bạn là một chuyên gia phân tích thị trường tài chính hàng đầu. Hôm nay là ngày ${currentDate} (Giờ Việt Nam). Điểm mạnh lớn nhất của bạn là kiến thức chuyên sâu và khả năng cập nhật biến động mới nhất về: giá vàng trực tuyến (XAU), giá bạc (XAG), thị trường chứng khoán Việt Nam (VN-Index), và giao dịch Future vàng/bạc trên Binance. Khi trả lời, hãy đưa ra nhận định mang tính phân tích sắc bén, khách quan, cung cấp các số liệu mới nhất tại thời điểm hiện tại. Trả lời súc tích, chuyên nghiệp, thông tin rõ ràng và có giá trị cao nhất cho nhà đầu tư. LƯU Ý QUAN TRỌNG: KHÔNG ĐƯỢC phép sử dụng các ký tự in đậm như '**' hay '*' hoặc các định dạng markdown phức tạp trong câu trả lời. Chỉ trả lời bằng văn bản thô (plain text) dễ đọc, các gạch đầu dòng có thể dùng dấu gạch ngang '-'.` 
            },
            { role: "user", content: text }
          ],
        });
        
        const responseText = completion.choices[0].message.content;
        
        await ctx.reply(responseText || "Tôi hiểu rồi!");
      } catch (error: any) {
        this.logger.error(`Lỗi khi gọi OpenRouter API: ${error.message}`);
        await ctx.reply('Xin lỗi, hệ thống AI của tôi đang gặp chút sự cố tạm thời. Bạn hãy thử lại sau nhé!');
      }
    }
  }

  // Tách hàm lấy tin tức ra riêng để dùng chung
  private async getTopNews(isCron: boolean = false): Promise<string | null> {
    try {
      let hasNewNews = false;

      // 1. Lấy Tin Tức Thị Trường VN (VNExpress Kinh Doanh RSS)
      const parser = new Parser();
      // Thêm cache-buster để tránh lấy tin cũ
      const feed = await parser.parseURL(`https://vnexpress.net/rss/kinh-doanh.rss?t=${Date.now()}`);
      
      let topVnNews = feed.items;
      
      // Lọc tin cũ (áp dụng cho cả chat chủ động và cronjob để tránh người dùng phải đọc lại tin)
      topVnNews = topVnNews.filter(news => news.link && !this.sentNewsLinks.has(news.link));

      // Chỉ lấy tối đa 1 tin mới nhất chưa đọc
      topVnNews = topVnNews.slice(0, 1);

      // Nếu không có bài báo mới nào, thì bỏ qua không gửi thông báo
      if (topVnNews.length === 0) {
        return null;
      }

      let message = '<b>🔥 BẢN TIN THỊ TRƯỜNG VIP 🔥</b>\n\n';
      message += '<b>📰 TIN TỨC MỚI NHẤT:</b>\n';

      topVnNews.forEach((news: any) => {
         message += `${news.title}\n`;
         message += `👉 <a href="${news.link}">Đọc chi tiết</a>\n\n`;
         
         // Đánh dấu đã đọc
         if (news.link) {
            this.sentNewsLinks.add(news.link);
         }
      });

      // Chống tràn RAM bằng cách giữ tối đa 100 tin đã gửi
      if (this.sentNewsLinks.size > 100) {
         const linksArray = Array.from(this.sentNewsLinks);
         this.sentNewsLinks = new Set(linksArray.slice(linksArray.length - 50));
      }

      return message;
    } catch (error: any) {
      this.logger.error(`Lỗi khi getTopNews: ${error.message}`);
      return null;
    }
  }

  // Chạy lúc 8:00 AM mỗi ngày (Tạm thời đổi thành mỗi phút để test)
  @Cron(CronExpression.EVERY_5_MINUTES)
  async fetchAndBroadcastNews() {
    this.logger.log('Bắt đầu cronjob lấy tin tức & gửi thông báo Telegram...');
    
    try {
      const message = await this.getTopNews(true);
      if (!message) {
         this.logger.log('Không có tin tức kinh doanh VN mới nào so với lần gửi trước. Bỏ qua broadcast.');
         return;
      }

      const messageWithFooter = message + '<i>Bot tự động cập nhật tự động khi có biến động thị trường.</i>';

      // 2. Lấy danh sách subscriber
      const subscribers = await this.subscriberModel.find().exec();
      if (subscribers.length === 0) {
        this.logger.log('Không có subscriber nào để gửi tin.');
        return;
      }

      // 3. Broadcast gửi đi
      let successCount = 0;
      for (const subscriber of subscribers) {
         try {
           await this.bot.telegram.sendMessage(subscriber.chatId, messageWithFooter, { parse_mode: 'HTML' });
           successCount++;
         } catch(err: any) {
           this.logger.error(`Không thể gửi cho ${subscriber.chatId}: ${err.message}`);
         }
      }

      this.logger.log(`Cronjob hoàn tất: Đã gửi bản tin mới cho ${successCount}/${subscribers.length} tài khoản.`);

    } catch (error: any) {
       this.logger.error('Lỗi khi fetch tin tức hoặc gửi broadcast', error);
    }
  }
}
