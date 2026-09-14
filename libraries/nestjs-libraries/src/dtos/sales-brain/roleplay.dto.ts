import { IsDefined, IsEnum, IsOptional, IsString } from 'class-validator';
import { RoleplayPersona } from '@prisma/client';

export class StartRoleplayDto {
  @IsEnum(RoleplayPersona)
  @IsDefined()
  persona: RoleplayPersona;

  @IsString()
  @IsOptional()
  salespersonId?: string;
}

export class RoleplayReplyDto {
  @IsString()
  @IsDefined()
  content: string;
}
