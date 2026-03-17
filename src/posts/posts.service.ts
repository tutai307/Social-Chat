import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './schemas/post.schema';
import { User } from '../users/schemas/user.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(User.name) private userModel: Model<User>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const newPost = new this.postModel({
      ...createPostDto,
      author: new Types.ObjectId(userId),
    });
    return (await newPost.save()).populate('author', 'fullName avatar');
  }

  async findAll(): Promise<Post[]> {
    return this.postModel
      .find()
      .sort({ createdAt: -1 })
      .populate('author', 'fullName avatar')
      .populate('comments.author', 'fullName avatar')
      .exec();
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'fullName avatar')
      .populate('comments.author', 'fullName avatar')
      .exec();
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return post;
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const post = await this.findOne(id);
    
    // Chỉ admin hoặc chủ sở hữu bài viết mới được xóa
    if (userRole !== UserRole.ADMIN && post.author['_id'].toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bài viết này');
    }

    await this.postModel.findByIdAndDelete(id).exec();
  }

  async toggleLike(id: string, userId: string): Promise<Post> {
    const post = await this.findOne(id);
    const userIdObj = new Types.ObjectId(userId);

    const index = (post.likes as Types.ObjectId[]).findIndex((id) =>
      id.equals(userIdObj),
    );

    if (index === -1) {
      post.likes.push(userIdObj);
      // Gửi thông báo like (chỉ khi không phải tự like bài mình)
      if (post.author['_id'].toString() !== userId) {
        const issuer = await this.userModel.findById(userId).select('fullName avatar').exec();
        await this.notificationsService.createAndNotify({
          recipient: post.author['_id'].toString(),
          issuer: {
            _id: userId,
            fullName: issuer?.fullName || 'Người dùng',
            avatar: issuer?.avatar || '',
          },
          type: 'like',
          post: id,
        });
      }
    } else {
      post.likes.splice(index, 1);
    }

    return (await post.save()).populate('comments.author', 'fullName avatar');
  }

  async addComment(
    id: string,
    userId: string,
    content: string,
  ): Promise<Post> {
    const post = await this.findOne(id);
    post.comments.push({
      author: new Types.ObjectId(userId),
      content,
      createdAt: new Date(),
    });

    const savedPost = await post.save();
    
    // Gửi thông báo comment (chỉ khi không phải tự comment bài mình)
    if (post.author['_id'].toString() !== userId) {
      const issuer = await this.userModel.findById(userId).select('fullName avatar').exec();
      await this.notificationsService.createAndNotify({
        recipient: post.author['_id'].toString(),
        issuer: {
          _id: userId,
          fullName: issuer?.fullName || 'Người dùng',
          avatar: issuer?.avatar || '',
        },
        type: 'comment',
        post: id,
      });
    }

    return savedPost.populate('comments.author', 'fullName avatar');
  }
}
