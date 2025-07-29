import { Module } from '@nestjs/common';
import { BudgetController } from './controller/budget.controller';
import { TransactionModule } from '../transaction/transaction.module';
import { CategoryModule } from './category.module';

const controller = [BudgetController];

@Module({
  imports: [TransactionModule, CategoryModule],
  controllers: [...controller]
})
export class BudgetModule {}
