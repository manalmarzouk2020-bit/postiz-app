import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ProductFaqDto {
  @IsString()
  @IsDefined()
  question: string;

  @IsString()
  @IsDefined()
  answer: string;
}

export class CreateProductDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsDefined()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  pricingModel?: string;

  @IsArray()
  @IsOptional()
  features?: string[];

  @IsArray()
  @IsOptional()
  benefits?: string[];

  @IsString()
  @IsOptional()
  primaryOutcome?: string;

  @IsArray()
  @IsOptional()
  secondaryOutcomes?: string[];

  @IsString()
  @IsOptional()
  targetMarket?: string;

  @IsString()
  @IsOptional()
  guarantees?: string;

  @IsString()
  @IsOptional()
  refundPolicy?: string;

  @IsArray()
  @IsOptional()
  competitors?: string[];

  @IsArray()
  @IsOptional()
  testimonials?: string[];

  @IsArray()
  @IsOptional()
  faqs?: ProductFaqDto[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
