import { Types } from 'mongoose';
import { Transaction } from '../schema/transaction.schema';
import { CreateTransactionRequestDto } from '../dto/request/create-transaction.request.dto';

export interface TransactionRepository {
  create(
    user_id: Types.ObjectId,
    workspace_id: Types.ObjectId,
    body: CreateTransactionRequestDto
  ): Promise<Transaction>;

  findAll(
    workspace_id: Types.ObjectId,
    options?: {
      start_date?: Date;
      end_date?: Date;
      type?: string;
      category?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<Transaction[]>;

  findById(_id: Types.ObjectId): Promise<Transaction>;

  update(
    _id: Types.ObjectId,
    body: Partial<CreateTransactionRequestDto>
  ): Promise<Transaction>;

  delete(_id: Types.ObjectId): Promise<Transaction>;

  findByWorkspaceAndDateRange(
    workspace_id: Types.ObjectId,
    start_date: Date,
    end_date: Date
  ): Promise<Transaction[]>;

  getTotalAmountByType(
    workspace_id: Types.ObjectId,
    type: string,
    start_date?: Date,
    end_date?: Date
  ): Promise<number>;

  getMonthlyStats(
    workspace_id: Types.ObjectId,
    year: number,
    month: number
  ): Promise<{
    total_income: number;
    total_expense: number;
    category_stats: Array<{
      category: string;
      amount: number;
      count: number;
    }>;
  }>;
}
