import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { CategoryService } from '../service/category.service';
import { CreateCategoryRequestDto } from '../dto/request/create-category.request.dto';
import { UpdateCategoryRequestDto } from '../dto/request/update-category.request.dto';
import { CategoryDto } from '../dto/category.dto';
import { JwtAuthGuard } from '../../auth/guard';
import { Serialize } from '../../../interceptor/serialize.interceptor';

@ApiTags('Category')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: '워크스페이스의 모든 카테고리 조회' })
  @ApiOkResponse({
    type: [CategoryDto],
    description: '카테고리 목록 조회 성공'
  })
  @ApiQuery({ name: 'workspaceId', description: '워크스페이스 ID' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['income', 'expense'],
    description: '카테고리 타입 (income 또는 expense)'
  })
  @Serialize(CategoryDto)
  @Get()
  async getCategories(
    @Query('workspaceId') workspaceId: string,
    @Query('type') type?: 'income' | 'expense'
  ) {
    console.log('getCategories');
    console.log(workspaceId, type);
    return this.categoryService.getCategories(workspaceId, type);
  }

  @ApiOperation({ summary: '새 카테고리 생성' })
  @ApiOkResponse({ type: CategoryDto, description: '카테고리 생성 성공' })
  @ApiQuery({ name: 'workspaceId', description: '워크스페이스 ID' })
  @Serialize(CategoryDto)
  @Post()
  async createCategory(
    @Query('workspaceId') workspaceId: string,
    @Body() createCategoryDto: CreateCategoryRequestDto
  ) {
    console.log('createCategory');
    console.log(workspaceId, createCategoryDto);
    return this.categoryService.createCategory(workspaceId, createCategoryDto);
  }

  @ApiOperation({ summary: '카테고리 수정' })
  @ApiOkResponse({ type: CategoryDto, description: '카테고리 수정 성공' })
  @Serialize(CategoryDto)
  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryRequestDto
  ) {
    return this.categoryService.updateCategory(id, updateCategoryDto);
  }

  @ApiOperation({ summary: '카테고리 삭제' })
  @ApiOkResponse({ description: '카테고리 삭제 성공' })
  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    await this.categoryService.deleteCategory(id);
    return {
      success: true,
      message: '카테고리가 성공적으로 삭제되었습니다.'
    };
  }
}
