import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ICategoryRepository } from '../interface/category.repository';
import { Category } from '../schema/category.schema';
import { CreateCategoryRequestDto } from '../dto/request/create-category.request.dto';

@Injectable()
export class CategoryRepositoryImplement implements ICategoryRepository {
  constructor(
    @InjectModel(Category.name, 'lovechedule')
    private readonly categoryModel: Model<Category>
  ) {}

  async findAllByWorkspace(
    workspaceId: string,
    type?: 'income' | 'expense'
  ): Promise<Category[]> {
    const query: any = { workspaceId: new Types.ObjectId(workspaceId) };
    if (type) {
      query.type = type;
    }
    console.log(query);
    return this.categoryModel.find(query).exec();
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoryModel.findById(id).exec();
  }

  async create(
    workspaceId: string,
    categoryDto: CreateCategoryRequestDto
  ): Promise<Category> {
    const category = new this.categoryModel({
      ...categoryDto,
      workspaceId: new Types.ObjectId(workspaceId)
    });
    return category.save();
  }

  async update(
    id: string,
    category: Partial<CreateCategoryRequestDto>
  ): Promise<Category | null> {
    return this.categoryModel
      .findByIdAndUpdate(id, category, { new: true })
      .exec();
  }

  async delete(id: string): Promise<any> {
    return this.categoryModel.findByIdAndDelete(id).exec();
  }
}
