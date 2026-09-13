import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { SalesFollowupStatus } from '@prisma/client';

@Injectable()
export class SalesFollowupsRepository {
  constructor(private _followup: PrismaRepository<'salesFollowup'>) {}

  create(organizationId: string, leadId: string, scheduledAt: Date, reason: string) {
    return this._followup.model.salesFollowup.create({
      data: { organizationId, leadId, scheduledAt, reason },
    });
  }

  getDue(before: Date) {
    return this._followup.model.salesFollowup.findMany({
      where: { status: 'PENDING', scheduledAt: { lte: before } },
      include: { lead: true },
      take: 50,
    });
  }

  getForOrganization(organizationId: string) {
    return this._followup.model.salesFollowup.findMany({
      where: { organizationId, status: 'PENDING' },
      include: { lead: { select: { id: true, name: true, email: true, leadScore: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  setStatus(id: string, status: SalesFollowupStatus) {
    return this._followup.model.salesFollowup.update({
      where: { id },
      data: { status },
    });
  }

  setStatusForOrg(organizationId: string, id: string, status: SalesFollowupStatus) {
    return this._followup.model.salesFollowup.updateMany({
      where: { id, organizationId },
      data: { status },
    });
  }

  hasPendingForLead(leadId: string) {
    return this._followup.model.salesFollowup.findFirst({
      where: { leadId, status: 'PENDING' },
    });
  }
}
