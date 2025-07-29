import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { TransactionRepository } from '../interface/transaction.repository';
import { Transaction, TransactionType } from '../schema/transaction.schema';
import { CreateTransactionRequestDto } from '../dto/request/create-transaction.request.dto';
import { UserDto } from '../../auth/dto/user.dto';
import { Types } from 'mongoose';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private readonly transactionRepository: TransactionRepository
  ) {}

  async create(
    user: UserDto,
    workspace_id: string,
    body: CreateTransactionRequestDto
  ): Promise<Transaction> {
    if (
      !Types.ObjectId.isValid(workspace_id) ||
      !Types.ObjectId.isValid(user._id)
    ) {
      throw new BadRequestException('Invalid workspace or user ID');
    }
    try {
      // 금액 검증
      if (body.amount < 0) {
        throw new BadRequestException('금액은 0보다 커야 합니다');
      }

      return await this.transactionRepository.create(
        new Types.ObjectId(user._id),
        new Types.ObjectId(workspace_id),
        body
      );
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e.message || e, e.status || 500);
    }
  }

  async findAll(
    workspace_id: string,
    options?: {
      start_date?: string;
      end_date?: string;
      type?: string;
      category?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<Transaction[]> {
    if (!Types.ObjectId.isValid(workspace_id)) {
      throw new BadRequestException('Invalid workspace ID');
    }
    try {
      const queryOptions = options
        ? {
            ...options,
            start_date: options.start_date
              ? new Date(options.start_date)
              : undefined,
            end_date: options.end_date ? new Date(options.end_date) : undefined
          }
        : undefined;

      return await this.transactionRepository.findAll(
        new Types.ObjectId(workspace_id),
        queryOptions
      );
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e.message || e, e.status || 500);
    }
  }

  async findById(_id: string): Promise<Transaction> {
    console.log('findById11', _id);
    if (!Types.ObjectId.isValid(_id)) {
      throw new BadRequestException('Invalid transaction ID');
    }
    try {
      const transaction = await this.transactionRepository.findById(
        new Types.ObjectId(_id)
      );

      if (!transaction) {
        throw new NotFoundException('거래를 찾을 수 없습니다');
      }

      return transaction;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e.message || e, e.status || 500);
    }
  }

  async update(
    _id: string,
    body: Partial<CreateTransactionRequestDto>
  ): Promise<Transaction> {
    if (!Types.ObjectId.isValid(_id)) {
      throw new BadRequestException('Invalid transaction ID');
    }
    try {
      // 거래 존재 여부 확인
      const existingTransaction = await this.transactionRepository.findById(
        new Types.ObjectId(_id)
      );

      if (!existingTransaction) {
        throw new NotFoundException('거래를 찾을 수 없습니다');
      }

      // 금액 검증 (업데이트하는 경우)
      if (body.amount !== undefined && body.amount < 0) {
        throw new BadRequestException('금액은 0보다 커야 합니다');
      }

      const result = await this.transactionRepository.update(
        new Types.ObjectId(_id),
        body
      );

      return result;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e.message || e, e.status || 500);
    }
  }

  async delete(_id: string): Promise<Transaction> {
    if (!Types.ObjectId.isValid(_id)) {
      throw new BadRequestException('Invalid transaction ID');
    }
    try {
      // 거래 존재 여부 확인
      const existingTransaction = await this.transactionRepository.findById(
        new Types.ObjectId(_id)
      );

      if (!existingTransaction) {
        throw new NotFoundException('거래를 찾을 수 없습니다');
      }

      return await this.transactionRepository.delete(new Types.ObjectId(_id));
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e.message || e, e.status || 500);
    }
  }

  async getMonthlyStats(
    workspace_id: string,
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
    if (!Types.ObjectId.isValid(workspace_id)) {
      throw new BadRequestException('Invalid workspace ID');
    }
    try {
      return await this.transactionRepository.getMonthlyStats(
        new Types.ObjectId(workspace_id),
        year,
        month
      );
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e.message || e, e.status || 500);
    }
  }

  async getTotalAmountByType(
    workspace_id: string,
    type: TransactionType,
    start_date?: string,
    end_date?: string
  ): Promise<number> {
    if (!Types.ObjectId.isValid(workspace_id)) {
      throw new BadRequestException('Invalid workspace ID');
    }
    try {
      return await this.transactionRepository.getTotalAmountByType(
        new Types.ObjectId(workspace_id),
        type,
        start_date ? new Date(start_date) : undefined,
        end_date ? new Date(end_date) : undefined
      );
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e.message || e, e.status || 500);
    }
  }

  async getDateRangeTransactions(
    workspace_id: string,
    start_date: string,
    end_date: string
  ): Promise<Transaction[]> {
    if (!Types.ObjectId.isValid(workspace_id)) {
      throw new BadRequestException('Invalid workspace ID');
    }
    try {
      return await this.transactionRepository.findByWorkspaceAndDateRange(
        new Types.ObjectId(workspace_id),
        new Date(start_date),
        new Date(end_date)
      );
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e.message || e, e.status || 500);
    }
  }
}
