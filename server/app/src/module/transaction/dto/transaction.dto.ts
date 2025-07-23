import { Expose, Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';
import { Workspace } from '../../workspace/schema/workspace.schema';
import { TransactionType, PaymentMethod } from '../schema/transaction.schema';

export class TransactionDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Expose()
  title: string;

  @Expose()
  amount: number;

  @Expose()
  type: TransactionType;

  @Expose()
  category: string;

  @Expose()
  description: string;

  @Expose()
  date: Date;

  @Expose()
  payment_method: PaymentMethod;

  @Expose()
  @Type(() => User)
  user: Types.ObjectId;

  @Expose()
  @Type(() => Workspace)
  workspace: Types.ObjectId;

  @Expose()
  is_recurring: boolean;

  @Expose()
  recurring_period: string;

  @Expose()
  participants: string[];
}
