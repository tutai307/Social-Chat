import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    return this.postsService.create(createPostDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả bài viết' })
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một bài viết' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bài viết (Chỉ chủ sở hữu hoặc ADMIN)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.postsService.delete(id, req.user.userId, req.user.role);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like hoặc Unlike bài viết' })
  toggleLike(@Param('id') id: string, @Request() req) {
    return this.postsService.toggleLike(id, req.user.userId);
  }

  @Post(':id/comment')
  @ApiOperation({ summary: 'Thêm bình luận vào bài viết' })
  addComment(
    @Param('id') id: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.postsService.addComment(id, req.user.userId, content);
  }
}
