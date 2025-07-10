import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category_id?: string;
  budget_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionDto {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category_id?: string;
  budget_id: string;
}

export interface UpdateTransactionDto {
  description?: string;
  amount?: number;
  type?: 'income' | 'expense';
  date?: string;
  category_id?: string;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async createTransaction(createTransactionDto: CreateTransactionDto, userId: string): Promise<Transaction> {
    this.logger.log(`Creating transaction for user: ${userId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...createTransactionDto,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating transaction:', error.message);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    this.logger.log(`Transaction created successfully: ${data.id}`);
    return data;
  }

  async getTransactionsByBudget(budgetId: string, userId: string): Promise<Transaction[]> {
    this.logger.log(`Fetching transactions for budget: ${budgetId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      this.logger.error('Error fetching transactions:', error.message);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return data || [];
  }

  async getTransactionsByCategory(categoryId: string, userId: string): Promise<Transaction[]> {
    this.logger.log(`Fetching transactions for category: ${categoryId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('category_id', categoryId)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      this.logger.error('Error fetching transactions:', error.message);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return data || [];
  }

  async getTransactionById(transactionId: string, userId: string): Promise<Transaction> {
    this.logger.log(`Fetching transaction: ${transactionId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      this.logger.error('Error fetching transaction:', error.message);
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Transaction not found');
      }
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }

    return data;
  }

  async updateTransaction(transactionId: string, updateTransactionDto: UpdateTransactionDto, userId: string): Promise<Transaction> {
    this.logger.log(`Updating transaction: ${transactionId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .update(updateTransactionDto)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating transaction:', error.message);
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Transaction not found');
      }
      throw new Error(`Failed to update transaction: ${error.message}`);
    }

    this.logger.log(`Transaction updated successfully: ${data.id}`);
    return data;
  }

  async deleteTransaction(transactionId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting transaction: ${transactionId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error('Error deleting transaction:', error.message);
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }

    this.logger.log(`Transaction deleted successfully: ${transactionId}`);
  }

  async getTransactionSummary(budgetId: string, userId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    transactionCount: number;
  }> {
    this.logger.log(`Getting transaction summary for budget: ${budgetId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('budget_id', budgetId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error('Error fetching transaction summary:', error.message);
      throw new Error(`Failed to fetch transaction summary: ${error.message}`);
    }

    const totalIncome = data
      ?.filter((t: { type: string }) => t.type === 'income')
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0) || 0;

    const totalExpenses = data
      ?.filter((t: { type: string }) => t.type === 'expense')
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0) || 0;

    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      transactionCount: data?.length || 0,
    };
  }
}