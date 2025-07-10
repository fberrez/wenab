import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({
    description: 'The name of the budget',
    example: 'Monthly Budget - January 2024',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Optional description of the budget',
    example: 'My monthly budget for January 2024',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Start date of the budget period',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({
    description: 'End date of the budget period',
    example: '2024-01-31',
  })
  @IsDateString()
  @IsNotEmpty()
  end_date: string;
}