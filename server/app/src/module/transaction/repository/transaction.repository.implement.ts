import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransactionRepository } from '../interface/transaction.repository';
import { Transaction, TransactionType } from '../schema/transaction.schema';
import { CreateTransactionRequestDto } from '../dto/request/create-transaction.request.dto';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const KST_TIMEZONE = 'Asia/Seoul';

@Injectable()
export class TransactionRepositoryImplement implements TransactionRepository {
  constructor(
    @InjectModel(Transaction.name, 'lovechedule')
    private transactionModel: Model<Transaction>
  ) {}

  async create(
    user_id: Types.ObjectId,
    workspace_id: Types.ObjectId,
    body: CreateTransactionRequestDto
  ): Promise<Transaction> {
    const transaction = new this.transactionModel({
      ...body,
      date: new Date(body.date),
      user: user_id,
      workspace: workspace_id
    });
    return transaction.save();
  }

  async findAll(
    workspace_id: Types.ObjectId,
    options?: {
      start_date?: Date;
      end_date?: Date;
      type?: string;
      category?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<Transaction[]> {
    const filter: any = { workspace: workspace_id };

    if (options?.start_date || options?.end_date) {
      filter.date = {};
      if (options.start_date) filter.date.$gte = options.start_date;
      if (options.end_date) filter.date.$lte = options.end_date;
    }

    if (options?.type) {
      filter.type = options.type;
    }

    if (options?.category) {
      filter.category = options.category;
    }

    let query = this.transactionModel
      .find(filter)
      .populate('user')
      .populate('workspace')
      .sort({ date: -1 });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.skip) {
      query = query.skip(options.skip);
    }

    return query.exec();
  }

  async findById(_id: Types.ObjectId): Promise<Transaction> {
    return this.transactionModel
      .findById(_id)
      .populate('user')
      .populate('workspace')
      .exec();
  }

  async update(
    _id: Types.ObjectId,
    body: Partial<CreateTransactionRequestDto>
  ): Promise<Transaction> {
    const updateData = {
      ...body
    };

    return this.transactionModel
      .findByIdAndUpdate(_id, updateData, { new: true })
      .exec();
  }

  async delete(_id: Types.ObjectId): Promise<Transaction> {
    return this.transactionModel.findByIdAndDelete(_id).exec();
  }

  async findByWorkspaceAndDateRange(
    workspace_id: Types.ObjectId,
    start_date: Date,
    end_date: Date
  ): Promise<Transaction[]> {
    return this.transactionModel
      .find({
        workspace: workspace_id,
        date: { $gte: start_date, $lte: end_date }
      })
      .populate('user')
      .sort({ date: -1 })
      .exec();
  }

  async getTotalAmountByType(
    workspace_id: Types.ObjectId,
    type: string,
    start_date?: Date,
    end_date?: Date
  ): Promise<number> {
    const matchFilter: any = {
      workspace: workspace_id,
      type: type
    };

    if (start_date || end_date) {
      matchFilter.date = {};
      if (start_date) matchFilter.date.$gte = start_date;
      if (end_date) matchFilter.date.$lte = end_date;
    }

    const result = await this.transactionModel.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  async getMonthlyStats(
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
  }> {
    const startDate = dayjs
      .tz(`${year}-${String(month).padStart(2, '0')}-01 00:00:00`, KST_TIMEZONE)
      .toDate();

    const endDate = dayjs
      .tz(`${year}-${String(month).padStart(2, '0')}-01`, KST_TIMEZONE)
      .endOf('month')
      .toDate();

    const aggregationPipeline = [
      {
        $match: {
          workspace: workspace_id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          categories: {
            $push: {
              category: '$category',
              amount: '$amount'
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          income_data: {
            $push: {
              $cond: [
                { $eq: ['$_id', TransactionType.INCOME] },
                { total: '$total', categories: '$categories' },
                '$$REMOVE'
              ]
            }
          },
          expense_data: {
            $push: {
              $cond: [
                { $eq: ['$_id', TransactionType.EXPENSE] },
                { total: '$total', categories: '$categories' },
                '$$REMOVE'
              ]
            }
          }
        }
      }
    ];

    const result = await this.transactionModel.aggregate(aggregationPipeline);

    if (result.length === 0) {
      return {
        total_income: 0,
        total_expense: 0,
        category_stats: []
      };
    }

    const data = result[0];
    const total_income = data.income_data?.[0]?.total || 0;
    const total_expense = data.expense_data?.[0]?.total || 0;

    // 카테고리별 통계 계산
    const categoryMap = new Map<string, { amount: number; count: number }>();

    // 수입 카테고리 처리
    if (data.income_data?.[0]?.categories) {
      for (const cat of data.income_data[0].categories) {
        const existing = categoryMap.get(cat.category) || {
          amount: 0,
          count: 0
        };
        categoryMap.set(cat.category, {
          amount: existing.amount + cat.amount,
          count: existing.count + 1
        });
      }
    }

    // 지출 카테고리 처리
    if (data.expense_data?.[0]?.categories) {
      for (const cat of data.expense_data[0].categories) {
        const existing = categoryMap.get(cat.category) || {
          amount: 0,
          count: 0
        };
        categoryMap.set(cat.category, {
          amount: existing.amount + cat.amount,
          count: existing.count + 1
        });
      }
    }

    const category_stats = Array.from(categoryMap.entries()).map(
      ([category, stats]) => ({
        category,
        amount: stats.amount,
        count: stats.count
      })
    );

    const finalResult = {
      total_income,
      total_expense,
      category_stats
    };

    return finalResult;
  }
}
