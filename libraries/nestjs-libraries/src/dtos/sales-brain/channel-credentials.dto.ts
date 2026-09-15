import { IsDefined, IsOptional, IsString } from 'class-validator';

export class UpdateMetaCredentialDto {
  @IsString()
  @IsDefined()
  verifyToken: string;

  @IsString()
  @IsOptional()
  appSecret?: string;

  @IsString()
  @IsOptional()
  whatsappAccessToken?: string;

  @IsString()
  @IsOptional()
  whatsappPhoneNumberId?: string;

  @IsString()
  @IsOptional()
  pageAccessToken?: string;

  @IsString()
  @IsOptional()
  pageId?: string;

  @IsString()
  @IsOptional()
  instagramAccountId?: string;
}

export class UpdateTelegramCredentialDto {
  @IsString()
  @IsDefined()
  botToken: string;

  @IsString()
  @IsOptional()
  webhookSecret?: string;
}
