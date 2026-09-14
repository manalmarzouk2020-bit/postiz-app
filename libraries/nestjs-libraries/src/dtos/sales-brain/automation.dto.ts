import { IsBoolean, IsDefined, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { SalesAutomationAction, SalesAutomationTrigger } from '@prisma/client';

export class CreateAutomationRuleDto {
  @IsString()
  @IsDefined()
  name: string;

  @IsEnum(SalesAutomationTrigger)
  @IsDefined()
  triggerType: SalesAutomationTrigger;

  @IsObject()
  @IsDefined()
  triggerValue: Record<string, unknown>;

  @IsEnum(SalesAutomationAction)
  @IsDefined()
  actionType: SalesAutomationAction;

  @IsObject()
  @IsDefined()
  actionValue: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAutomationRuleDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  name?: string;
}
