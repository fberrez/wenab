import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService, CategoryService, TransactionService],
  exports: [BudgetService, CategoryService, TransactionService],
})
export class BudgetModule {}