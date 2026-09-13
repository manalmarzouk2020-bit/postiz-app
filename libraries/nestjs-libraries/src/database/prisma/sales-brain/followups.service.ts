import { Injectable } from '@nestjs/common';
import { SalesFollowupsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/followups.repository';

const URGENCY_DELAY_HOURS: Record<string, number> = {
  high: 24,
  medium: 48,
  low: 96,
};

@Injectable()
export class SalesFollowupsService {
  constructor(private _followupsRepository: SalesFollowupsRepository) {}

  async scheduleIfNeeded(
    organizationId: string,
    leadId: string,
    urgency: string,
    reason: string
  ) {
    const existing = await this._followupsRepository.hasPendingForLead(leadId);
    if (existing) {
      return existing;
    }
    const hours = URGENCY_DELAY_HOURS[urgency] ?? URGENCY_DELAY_HOURS.medium;
    const scheduledAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    return this._followupsRepository.create(organizationId, leadId, scheduledAt, reason);
  }

  getForOrganization(organizationId: string) {
    return this._followupsRepository.getForOrganization(organizationId);
  }

  getDue() {
    return this._followupsRepository.getDue(new Date());
  }

  markSent(id: string) {
    return this._followupsRepository.setStatus(id, 'SENT');
  }

  cancel(organizationId: string, id: string) {
    return this._followupsRepository.setStatusForOrg(organizationId, id, 'CANCELLED');
  }
}
