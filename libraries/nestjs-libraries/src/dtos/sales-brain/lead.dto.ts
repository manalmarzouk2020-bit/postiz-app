import { IsDefined, IsEnum, IsOptional, IsString } from 'class-validator';
import { SalesChannel } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(SalesChannel)
  @IsOptional()
  source?: SalesChannel;

  @IsString()
  @IsOptional()
  productInterestId?: string;

  @IsString()
  @IsOptional()
  intent?: string;
}

export class SendMessageDto {
  @IsString()
  @IsDefined()
  content: string;
}
