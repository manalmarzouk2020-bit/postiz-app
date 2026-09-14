import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Prisma, SalesAutonomyLevel } from '@prisma/client';

@Injectable()
export class SalesSettingsRepository {
  constructor(private _settings: PrismaRepository<'salesSettings'>) {}

  async getOrCreate(organizationId: string) {
    const existing = await this._settings.model.salesSettings.findUnique({
      where: { organizationId },
    });
    if (existing) {
      return existing;
    }
    return this._settings.model.salesSettings.create({
      data: { organizationId },
    });
  }

  update(
    organizationId: string,
    data: {
      autonomyLevel?: SalesAutonomyLevel;
      allowedClaims?: Prisma.InputJsonValue;
      forbiddenClaims?: Prisma.InputJsonValue;
      businessHours?: Prisma.InputJsonValue;
      assistantName?: string;
    }
  ) {
    return this._settings.model.salesSettings.upsert({
      where: { organizationId },
      create: { organizationId, ...data },
      update: data,
    });
  }
}
