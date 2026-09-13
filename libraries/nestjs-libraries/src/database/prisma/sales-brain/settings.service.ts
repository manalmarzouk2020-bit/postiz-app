import { Injectable } from '@nestjs/common';
import { SalesSettingsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/settings.repository';
import { UpdateSalesSettingsDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/settings.dto';

@Injectable()
export class SalesSettingsService {
  constructor(private _settingsRepository: SalesSettingsRepository) {}

  getSettings(organizationId: string) {
    return this._settingsRepository.getOrCreate(organizationId);
  }

  updateSettings(organizationId: string, body: UpdateSalesSettingsDto) {
    return this._settingsRepository.update(organizationId, {
      autonomyLevel: body.autonomyLevel,
      allowedClaims: body.allowedClaims,
      forbiddenClaims: body.forbiddenClaims,
      businessHours: body.businessHours,
    });
  }
}
