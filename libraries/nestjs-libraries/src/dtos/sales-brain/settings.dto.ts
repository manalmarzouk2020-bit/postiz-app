import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { SalesAutonomyLevel } from '@prisma/client';

export class UpdateSalesSettingsDto {
  @IsEnum(SalesAutonomyLevel)
  @IsOptional()
  autonomyLevel?: SalesAutonomyLevel;

  @IsArray()
  @IsOptional()
  allowedClaims?: string[];

  @IsArray()
  @IsOptional()
  forbiddenClaims?: string[];

  @IsString()
  @IsOptional()
  businessHours?: string;

  @IsString()
  @IsOptional()
  assistantName?: string;
}
