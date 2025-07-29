import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ICategoryRepository } from '../interface/category.repository';
import { CreateCategoryRequestDto } from '../dto/request/create-category.request.dto';
import { UpdateCategoryRequestDto } from '../dto/request/update-category.request.dto';
import { Category } from '../schema/category.schema';

@Injectable()
export class CategoryService {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository
  ) {}

  createCategory(
    workspaceId: string,
    createCategoryDto: CreateCategoryRequestDto
  ): Promise<Category> {
    return this.categoryRepository.create(workspaceId, createCategoryDto);
  }

  getCategories(
    workspaceId: string,
    type?: 'income' | 'expense'
  ): Promise<Category[]> {
    return this.categoryRepository.findAllByWorkspace(workspaceId, type);
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryRequestDto
  ): Promise<Category> {
    const updatedCategory = await this.categoryRepository.update(
      id,
      updateCategoryDto
    );
    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (!result) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
  }
}
