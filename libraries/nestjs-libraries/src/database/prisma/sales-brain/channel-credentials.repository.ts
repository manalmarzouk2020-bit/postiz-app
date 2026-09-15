import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import {
  UpdateMetaCredentialDto,
  UpdateTelegramCredentialDto,
} from '@gitroom/nestjs-libraries/dtos/sales-brain/channel-credentials.dto';

@Injectable()
export class ChannelCredentialsRepository {
  constructor(
    private _meta: PrismaRepository<'salesMetaAppCredential'>,
    private _telegram: PrismaRepository<'salesTelegramCredential'>
  ) {}

  getMeta(organizationId: string) {
    return this._meta.model.salesMetaAppCredential.findUnique({
      where: { organizationId },
    });
  }

  getMetaByApiKey(organizationId: string) {
    return this.getMeta(organizationId);
  }

  upsertMeta(organizationId: string, data: UpdateMetaCredentialDto) {
    return this._meta.model.salesMetaAppCredential.upsert({
      where: { organizationId },
      create: { organizationId, ...data },
      update: data,
    });
  }

  getTelegram(organizationId: string) {
    return this._telegram.model.salesTelegramCredential.findUnique({
      where: { organizationId },
    });
  }

  upsertTelegram(organizationId: string, data: UpdateTelegramCredentialDto) {
    return this._telegram.model.salesTelegramCredential.upsert({
      where: { organizationId },
      create: { organizationId, ...data },
      update: data,
    });
  }
}
