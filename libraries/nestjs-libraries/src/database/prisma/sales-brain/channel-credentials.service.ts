import { Injectable } from '@nestjs/common';
import { ChannelCredentialsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/channel-credentials.repository';
import {
  UpdateMetaCredentialDto,
  UpdateTelegramCredentialDto,
} from '@gitroom/nestjs-libraries/dtos/sales-brain/channel-credentials.dto';

const mask = (value?: string | null) => {
  if (!value) return null;
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
};

@Injectable()
export class ChannelCredentialsService {
  constructor(private _repository: ChannelCredentialsRepository) {}

  private webhookBase() {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  }

  async getMeta(organizationId: string, apiKey: string) {
    const record = await this._repository.getMeta(organizationId);
    return {
      configured: !!record,
      webhookUrl: `${this.webhookBase()}/sales-brain/channels/meta/${apiKey}/webhook`,
      verifyToken: record?.verifyToken || null,
      appSecret: mask(record?.appSecret),
      whatsappAccessToken: mask(record?.whatsappAccessToken),
      whatsappPhoneNumberId: record?.whatsappPhoneNumberId || null,
      pageAccessToken: mask(record?.pageAccessToken),
      pageId: record?.pageId || null,
      instagramAccountId: record?.instagramAccountId || null,
    };
  }

  updateMeta(organizationId: string, body: UpdateMetaCredentialDto) {
    return this._repository.upsertMeta(organizationId, body);
  }

  async getTelegram(organizationId: string, apiKey: string) {
    const record = await this._repository.getTelegram(organizationId);
    return {
      configured: !!record,
      webhookUrl: `${this.webhookBase()}/sales-brain/channels/telegram/${apiKey}/webhook`,
      botToken: mask(record?.botToken),
      webhookSecret: mask(record?.webhookSecret),
    };
  }

  updateTelegram(organizationId: string, body: UpdateTelegramCredentialDto) {
    return this._repository.upsertTelegram(organizationId, body);
  }
}
