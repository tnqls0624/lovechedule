import { Category } from '../schema/category.schema';
import { CreateCategoryRequestDto } from '../dto/request/create-category.request.dto';

export interface ICategoryRepository {
  findAllByWorkspace(
    workspaceId: string,
    type?: 'income' | 'expense'
  ): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  create(
    workspaceId: string,
    category: CreateCategoryRequestDto
  ): Promise<Category>;
  update(id: string, category: Partial<Category>): Promise<Category | null>;
  delete(id: string): Promise<any>;
}
