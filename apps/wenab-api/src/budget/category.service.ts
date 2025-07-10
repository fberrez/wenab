import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  budget_id: string;
  allocated_amount: number;
  spent_amount: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  budget_id: string;
  allocated_amount: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  allocated_amount?: number;
}

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async createCategory(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
    this.logger.log(`Creating category for user: ${userId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...createCategoryDto,
        user_id: userId,
        spent_amount: 0,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating category:', error.message);
      throw new Error(`Failed to create category: ${error.message}`);
    }

    this.logger.log(`Category created successfully: ${data.id}`);
    return data;
  }

  async getCategoriesByBudget(budgetId: string, userId: string): Promise<Category[]> {
    this.logger.log(`Fetching categories for budget: ${budgetId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Error fetching categories:', error.message);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }

  async getCategoryById(categoryId: string, userId: string): Promise<Category> {
    this.logger.log(`Fetching category: ${categoryId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .single();

    if (error) {
      this.logger.error('Error fetching category:', error.message);
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Category not found');
      }
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return data;
  }

  async updateCategory(categoryId: string, updateCategoryDto: UpdateCategoryDto, userId: string): Promise<Category> {
    this.logger.log(`Updating category: ${categoryId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('categories')
      .update(updateCategoryDto)
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating category:', error.message);
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Category not found');
      }
      throw new Error(`Failed to update category: ${error.message}`);
    }

    this.logger.log(`Category updated successfully: ${data.id}`);
    return data;
  }

  async deleteCategory(categoryId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting category: ${categoryId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error('Error deleting category:', error.message);
      throw new Error(`Failed to delete category: ${error.message}`);
    }

    this.logger.log(`Category deleted successfully: ${categoryId}`);
  }

  async updateCategorySpentAmount(categoryId: string, userId: string): Promise<void> {
    this.logger.log(`Updating spent amount for category: ${categoryId}`);
    
    const supabase = this.supabaseService.getClient();
    
    // Get total spent amount for this category
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('category_id', categoryId)
      .eq('type', 'expense');

    if (transactionError) {
      this.logger.error('Error calculating spent amount:', transactionError.message);
      throw new Error(`Failed to calculate spent amount: ${transactionError.message}`);
    }

    const spentAmount = transactionData?.reduce((sum: number, transaction: { amount: number }) => sum + transaction.amount, 0) || 0;

    // Update category spent amount
    const { error: updateError } = await supabase
      .from('categories')
      .update({ spent_amount: spentAmount })
      .eq('id', categoryId)
      .eq('user_id', userId);

    if (updateError) {
      this.logger.error('Error updating category spent amount:', updateError.message);
      throw new Error(`Failed to update category spent amount: ${updateError.message}`);
    }

    this.logger.log(`Category spent amount updated: ${spentAmount}`);
  }
}