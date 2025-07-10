import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto';

export interface Budget {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  total_income: number;
  total_expenses: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async createBudget(createBudgetDto: CreateBudgetDto, userId: string): Promise<Budget> {
    this.logger.log(`Creating budget for user: ${userId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        ...createBudgetDto,
        user_id: userId,
        total_income: 0,
        total_expenses: 0,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating budget:', error.message);
      throw new Error(`Failed to create budget: ${error.message}`);
    }

    this.logger.log(`Budget created successfully: ${data.id}`);
    return data;
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    this.logger.log(`Fetching budgets for user: ${userId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching budgets:', error.message);
      throw new Error(`Failed to fetch budgets: ${error.message}`);
    }

    return data || [];
  }

  async getBudgetById(budgetId: string, userId: string): Promise<Budget> {
    this.logger.log(`Fetching budget: ${budgetId} for user: ${userId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .eq('user_id', userId)
      .single();

    if (error) {
      this.logger.error('Error fetching budget:', error.message);
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Budget not found');
      }
      throw new Error(`Failed to fetch budget: ${error.message}`);
    }

    return data;
  }

  async updateBudget(budgetId: string, updateBudgetDto: UpdateBudgetDto, userId: string): Promise<Budget> {
    this.logger.log(`Updating budget: ${budgetId} for user: ${userId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('budgets')
      .update(updateBudgetDto)
      .eq('id', budgetId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating budget:', error.message);
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Budget not found');
      }
      throw new Error(`Failed to update budget: ${error.message}`);
    }

    this.logger.log(`Budget updated successfully: ${data.id}`);
    return data;
  }

  async deleteBudget(budgetId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting budget: ${budgetId} for user: ${userId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error('Error deleting budget:', error.message);
      throw new Error(`Failed to delete budget: ${error.message}`);
    }

    this.logger.log(`Budget deleted successfully: ${budgetId}`);
  }

  async updateBudgetTotals(budgetId: string, userId: string): Promise<void> {
    this.logger.log(`Updating totals for budget: ${budgetId}`);
    
    const supabase = this.supabaseService.getClient();
    
    // Get total income
    const { data: incomeData, error: incomeError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('budget_id', budgetId)
      .eq('type', 'income');

    if (incomeError) {
      this.logger.error('Error calculating income:', incomeError.message);
      throw new Error(`Failed to calculate income: ${incomeError.message}`);
    }

    // Get total expenses
    const { data: expenseData, error: expenseError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('budget_id', budgetId)
      .eq('type', 'expense');

    if (expenseError) {
      this.logger.error('Error calculating expenses:', expenseError.message);
      throw new Error(`Failed to calculate expenses: ${expenseError.message}`);
    }

    const totalIncome = incomeData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
    const totalExpenses = expenseData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

    // Update budget totals
    const { error: updateError } = await supabase
      .from('budgets')
      .update({
        total_income: totalIncome,
        total_expenses: totalExpenses,
      })
      .eq('id', budgetId)
      .eq('user_id', userId);

    if (updateError) {
      this.logger.error('Error updating budget totals:', updateError.message);
      throw new Error(`Failed to update budget totals: ${updateError.message}`);
    }

    this.logger.log(`Budget totals updated: income=${totalIncome}, expenses=${totalExpenses}`);
  }
}