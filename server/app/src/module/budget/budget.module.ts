import { Module } from '@nestjs/common';
import { BudgetController } from './controller/budget.controller';
import { TransactionModule } from '../transaction/transaction.module';

const controller = [BudgetController];

@Module({
  imports: [TransactionModule],
  controllers: [...controller]
})
export class BudgetModule {}
