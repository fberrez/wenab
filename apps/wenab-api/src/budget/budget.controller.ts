import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('budgets')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,
    private readonly categoryService: CategoryService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBudget(
    @Body() createBudgetDto: CreateBudgetDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.budgetService.createBudget(createBudgetDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Budgets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBudgets(@Request() req: any) {
    const userId = req.user.sub;
    return this.budgetService.getBudgets(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific budget by ID' })
  @ApiResponse({ status: 200, description: 'Budget retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBudgetById(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.budgetService.getBudgetById(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a budget' })
  @ApiResponse({ status: 200, description: 'Budget updated successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateBudget(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.budgetService.updateBudget(id, updateBudgetDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiResponse({ status: 204, description: 'Budget deleted successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteBudget(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    await this.budgetService.deleteBudget(id, userId);
  }

  // Category endpoints
  @Post(':budgetId/categories')
  @ApiOperation({ summary: 'Create a new category for a budget' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCategory(
    @Param('budgetId') budgetId: string,
    @Body() createCategoryDto: any,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.categoryService.createCategory(
      { ...createCategoryDto, budget_id: budgetId },
      userId,
    );
  }

  @Get(':budgetId/categories')
  @ApiOperation({ summary: 'Get all categories for a budget' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCategories(@Param('budgetId') budgetId: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.categoryService.getCategoriesByBudget(budgetId, userId);
  }

  // Transaction endpoints
  @Post(':budgetId/transactions')
  @ApiOperation({ summary: 'Create a new transaction for a budget' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTransaction(
    @Param('budgetId') budgetId: string,
    @Body() createTransactionDto: any,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.transactionService.createTransaction(
      { ...createTransactionDto, budget_id: budgetId },
      userId,
    );
  }

  @Get(':budgetId/transactions')
  @ApiOperation({ summary: 'Get all transactions for a budget' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactions(@Param('budgetId') budgetId: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.transactionService.getTransactionsByBudget(budgetId, userId);
  }

  @Get(':budgetId/summary')
  @ApiOperation({ summary: 'Get budget summary with totals' })
  @ApiResponse({ status: 200, description: 'Budget summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBudgetSummary(@Param('budgetId') budgetId: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.transactionService.getTransactionSummary(budgetId, userId);
  }
}