import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'The type of subscription plan',
    enum: ['basic', 'premium', 'enterprise'],
    example: 'premium',
  })
  @IsEnum(['basic', 'premium', 'enterprise'])
  @IsNotEmpty()
  planType: 'basic' | 'premium' | 'enterprise';

  @ApiProperty({
    description: 'The billing interval',
    enum: ['monthly', 'yearly'],
    example: 'monthly',
  })
  @IsEnum(['monthly', 'yearly'])
  @IsNotEmpty()
  interval: 'monthly' | 'yearly';

  @ApiProperty({
    description: 'Customer email address',
    example: 'john.doe@example.com',
  })
  @IsString()
  @IsNotEmpty()
  customerEmail: string;

  @ApiProperty({
    description: 'Customer first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  customerGivenName: string;

  @ApiProperty({
    description: 'Customer last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  customerFamilyName: string;

  @ApiProperty({
    description: 'Customer address line 1',
    example: '123 Main St',
    required: false,
  })
  @IsString()
  @IsOptional()
  customerAddressLine1?: string;

  @ApiProperty({
    description: 'Customer address line 2',
    example: 'Apt 4B',
    required: false,
  })
  @IsString()
  @IsOptional()
  customerAddressLine2?: string;

  @ApiProperty({
    description: 'Customer city',
    example: 'London',
    required: false,
  })
  @IsString()
  @IsOptional()
  customerCity?: string;

  @ApiProperty({
    description: 'Customer region/state',
    example: 'England',
    required: false,
  })
  @IsString()
  @IsOptional()
  customerRegion?: string;

  @ApiProperty({
    description: 'Customer postal code',
    example: 'SW1A 1AA',
    required: false,
  })
  @IsString()
  @IsOptional()
  customerPostalCode?: string;

  @ApiProperty({
    description: 'Customer country code',
    example: 'GB',
    required: false,
  })
  @IsString()
  @IsOptional()
  customerCountryCode?: string;
}