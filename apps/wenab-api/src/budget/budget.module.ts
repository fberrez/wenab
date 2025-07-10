import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { ZeroBasedBudgetingService } from './zero-based-budgeting.service';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService, CategoryService, TransactionService, ZeroBasedBudgetingService],
  exports: [BudgetService, CategoryService, TransactionService, ZeroBasedBudgetingService],
})
export class BudgetModule {}