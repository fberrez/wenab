import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Groceries',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Food and household items',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Budgeted amount in cents',
    example: 50000,
  })
  @IsNumber()
  budgetedAmount: number;

  @ApiProperty({
    description: 'Category color (hex code)',
    example: '#3B82F6',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({
    description: 'Category icon',
    example: 'shopping-cart',
    required: false,
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({
    description: 'Whether this is a hidden category',
    example: false,
    required: false,
  })
  @IsOptional()
  isHidden?: boolean;
}

export class CreateBudgetDto {
  @ApiProperty({
    description: 'Budget name',
    example: 'March 2024 Budget',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Budget description',
    example: 'Monthly budget for March 2024',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Budget start date',
    example: '2024-03-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Budget end date',
    example: '2024-03-31',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Total income for the budget period in cents',
    example: 300000,
  })
  @IsNumber()
  totalIncome: number;

  @ApiProperty({
    description: 'Budget categories',
    type: [CategoryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  categories: CategoryDto[];

  @ApiProperty({
    description: 'Whether this is a shared budget',
    example: false,
    required: false,
  })
  @IsOptional()
  isShared?: boolean;

  @ApiProperty({
    description: 'Shared user IDs (for shared budgets)',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sharedUserIds?: string[];
}