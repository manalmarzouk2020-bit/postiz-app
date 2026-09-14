import { IsDefined, IsOptional, IsString } from 'class-validator';

export class CreateSalespersonDto {
  @IsString()
  @IsDefined()
  name: string;

  @IsString()
  @IsOptional()
  email?: string;
}
