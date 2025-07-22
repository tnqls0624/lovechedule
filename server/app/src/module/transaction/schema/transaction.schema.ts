import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Expose, Transform, Type } from 'class-transformer';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';
import { Workspace } from '../../workspace/schema/workspace.schema';

export type TransactionDocument = Transaction & Document<Types.ObjectId>;

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  OTHER = 'other'
}

@Schema({
  timestamps: true,
  collection: 'transactions'
})
export class Transaction {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Expose()
  @Prop({ required: true, type: String })
  title: string;

  @Expose()
  @Prop({ required: true, type: Number })
  amount: number;

  @Expose()
  @Prop({ required: true, type: String, enum: TransactionType })
  type: TransactionType;

  @Expose()
  @Prop({ required: true, type: String })
  category: string;

  @Expose()
  @Prop({ type: String })
  description: string;

  @Expose()
  @Prop({ required: true, type: Date })
  date: Date;

  @Expose()
  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.CASH })
  payment_method: PaymentMethod;

  @Expose()
  @Type(() => User)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Expose()
  @Type(() => Workspace)
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspace: Types.ObjectId;

  @Expose()
  @Prop({ type: Boolean, default: false })
  is_recurring: boolean;

  @Expose()
  @Prop({ type: String })
  recurring_period: string; // 'monthly', 'weekly', 'yearly'
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
