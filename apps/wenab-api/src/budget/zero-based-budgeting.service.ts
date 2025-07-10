import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';

export interface BudgetSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  readyToAssign: number;
  categories: CategorySummary[];
  isShared: boolean;
  sharedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  description?: string;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  color?: string;
  icon?: string;
  isHidden: boolean;
  transactions: TransactionSummary[];
}

export interface TransactionSummary {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
}

export interface EnvelopeStatus {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
  percentageUsed: number;
}

@Injectable()
export class ZeroBasedBudgetingService {
  private readonly logger = new Logger(ZeroBasedBudgetingService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async createBudget(userId: string, budgetData: any): Promise<BudgetSummary> {
    this.logger.log(`Creating zero-based budget for user: ${userId}`);
    
    const supabase = this.supabaseService.getClient();
    
    // Validate zero-based budgeting principle
    const totalBudgeted = budgetData.categories.reduce((sum: number, cat: any) => sum + cat.budgetedAmount, 0);
    
    if (totalBudgeted !== budgetData.totalIncome) {
      throw new BadRequestException(
        `Zero-based budgeting requires total budgeted amount (${totalBudgeted}) to equal total income (${budgetData.totalIncome})`
      );
    }

    try {
      // Create budget
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          name: budgetData.name,
          description: budgetData.description,
          start_date: budgetData.startDate,
          end_date: budgetData.endDate,
          total_income: budgetData.totalIncome,
          is_shared: budgetData.isShared || false,
          shared_user_ids: budgetData.sharedUserIds || [],
        })
        .select()
        .single();

      if (budgetError) {
        this.logger.error('Error creating budget:', budgetError.message);
        throw new Error(`Failed to create budget: ${budgetError.message}`);
      }

      // Create categories
      const categories = await Promise.all(
        budgetData.categories.map(async (category: any) => {
          const { data: cat, error: catError } = await supabase
            .from('categories')
            .insert({
              budget_id: budget.id,
              name: category.name,
              description: category.description,
              budgeted_amount: category.budgetedAmount,
              color: category.color,
              icon: category.icon,
              is_hidden: category.isHidden || false,
            })
            .select()
            .single();

          if (catError) {
            this.logger.error('Error creating category:', catError.message);
            throw new Error(`Failed to create category: ${catError.message}`);
          }

          return cat;
        })
      );

      this.logger.log(`Budget created successfully: ${budget.id}`);
      return this.getBudgetSummary(budget.id);
    } catch (error) {
      this.logger.error('Error creating budget:', error);
      throw new Error(`Failed to create budget: ${error.message}`);
    }
  }

  async getBudgetSummary(budgetId: string): Promise<BudgetSummary> {
    const supabase = this.supabaseService.getClient();
    
    // Get budget
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .single();

    if (budgetError) {
      this.logger.error('Error getting budget:', budgetError.message);
      throw new Error(`Failed to get budget: ${budgetError.message}`);
    }

    // Get categories with transactions
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        *,
        transactions (*)
      `)
      .eq('budget_id', budgetId);

    if (categoriesError) {
      this.logger.error('Error getting categories:', categoriesError.message);
      throw new Error(`Failed to get categories: ${categoriesError.message}`);
    }

    // Calculate totals
    const totalBudgeted = categories.reduce((sum, cat) => sum + cat.budgeted_amount, 0);
    const totalSpent = categories.reduce((sum, cat) => {
      const categorySpent = cat.transactions.reduce((catSum, trans) => catSum + trans.amount, 0);
      return sum + categorySpent;
    }, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const readyToAssign = budget.total_income - totalBudgeted;

    // Build category summaries
    const categorySummaries = categories.map(cat => {
      const spentAmount = cat.transactions.reduce((sum, trans) => sum + trans.amount, 0);
      const remainingAmount = cat.budgeted_amount - spentAmount;

      return {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        budgetedAmount: cat.budgeted_amount,
        spentAmount,
        remainingAmount,
        color: cat.color,
        icon: cat.icon,
        isHidden: cat.is_hidden,
        transactions: cat.transactions.map(trans => ({
          id: trans.id,
          amount: trans.amount,
          description: trans.description,
          date: trans.date,
          categoryId: trans.category_id,
        })),
      };
    });

    return {
      id: budget.id,
      name: budget.name,
      startDate: budget.start_date,
      endDate: budget.end_date,
      totalIncome: budget.total_income,
      totalBudgeted,
      totalSpent,
      totalRemaining,
      readyToAssign,
      categories: categorySummaries,
      isShared: budget.is_shared,
      sharedUserIds: budget.shared_user_ids || [],
      createdAt: budget.created_at,
      updatedAt: budget.updated_at,
    };
  }

  async getEnvelopeStatus(budgetId: string): Promise<EnvelopeStatus[]> {
    const budgetSummary = await this.getBudgetSummary(budgetId);
    
    return budgetSummary.categories.map(cat => {
      const percentageUsed = cat.budgetedAmount > 0 ? (cat.spentAmount / cat.budgetedAmount) * 100 : 0;
      
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        budgeted: cat.budgetedAmount,
        spent: cat.spentAmount,
        remaining: cat.remainingAmount,
        isOverBudget: cat.spentAmount > cat.budgetedAmount,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
      };
    });
  }

  async addTransaction(
    budgetId: string,
    categoryId: string,
    transactionData: {
      amount: number;
      description: string;
      date: string;
    }
  ): Promise<void> {
    this.logger.log(`Adding transaction to budget: ${budgetId}, category: ${categoryId}`);
    
    const supabase = this.supabaseService.getClient();
    
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          budget_id: budgetId,
          category_id: categoryId,
          amount: transactionData.amount,
          description: transactionData.description,
          date: transactionData.date,
        });

      if (error) {
        this.logger.error('Error adding transaction:', error.message);
        throw new Error(`Failed to add transaction: ${error.message}`);
      }

      this.logger.log('Transaction added successfully');
    } catch (error) {
      this.logger.error('Error adding transaction:', error);
      throw new Error(`Failed to add transaction: ${error.message}`);
    }
  }

  async moveMoney(
    budgetId: string,
    fromCategoryId: string,
    toCategoryId: string,
    amount: number
  ): Promise<void> {
    this.logger.log(`Moving ${amount} from category ${fromCategoryId} to ${toCategoryId}`);
    
    const supabase = this.supabaseService.getClient();
    
    try {
      // Get current category amounts
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, budgeted_amount')
        .in('id', [fromCategoryId, toCategoryId]);

      if (categoriesError) {
        throw new Error(`Failed to get categories: ${categoriesError.message}`);
      }

      const fromCategory = categories.find(c => c.id === fromCategoryId);
      const toCategory = categories.find(c => c.id === toCategoryId);

      if (!fromCategory || !toCategory) {
        throw new Error('One or both categories not found');
      }

      if (fromCategory.budgeted_amount < amount) {
        throw new BadRequestException('Insufficient funds in source category');
      }

      // Update category amounts
      await supabase
        .from('categories')
        .update({ budgeted_amount: fromCategory.budgeted_amount - amount })
        .eq('id', fromCategoryId);

      await supabase
        .from('categories')
        .update({ budgeted_amount: toCategory.budgeted_amount + amount })
        .eq('id', toCategoryId);

      this.logger.log('Money moved successfully');
    } catch (error) {
      this.logger.error('Error moving money:', error);
      throw new Error(`Failed to move money: ${error.message}`);
    }
  }

  async rolloverUnusedFunds(budgetId: string, targetBudgetId: string): Promise<void> {
    this.logger.log(`Rolling over unused funds from budget ${budgetId} to ${targetBudgetId}`);
    
    const sourceBudget = await this.getBudgetSummary(budgetId);
    const targetBudget = await this.getBudgetSummary(targetBudgetId);
    
    // Find categories with remaining funds
    const categoriesWithRemaining = sourceBudget.categories.filter(cat => cat.remainingAmount > 0);
    
    for (const category of categoriesWithRemaining) {
      // Find matching category in target budget
      const targetCategory = targetBudget.categories.find(cat => cat.name === category.name);
      
      if (targetCategory) {
        await this.moveMoney(
          targetBudgetId,
          targetBudget.categories.find(cat => cat.name === 'Ready to Assign')?.id || targetCategory.id,
          targetCategory.id,
          category.remainingAmount
        );
      }
    }
  }

  async getReadyToAssign(budgetId: string): Promise<number> {
    const budgetSummary = await this.getBudgetSummary(budgetId);
    return budgetSummary.readyToAssign;
  }

  async assignToCategory(budgetId: string, categoryId: string, amount: number): Promise<void> {
    const readyToAssign = await this.getReadyToAssign(budgetId);
    
    if (readyToAssign < amount) {
      throw new BadRequestException('Insufficient funds in Ready to Assign');
    }
    
    await this.moveMoney(budgetId, 'ready-to-assign', categoryId, amount);
  }
}