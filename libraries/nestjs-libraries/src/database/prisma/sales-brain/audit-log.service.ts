import { Injectable } from '@nestjs/common';
import { SalesAuditLogRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/audit-log.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesAuditLogService {
  constructor(private _auditLogRepository: SalesAuditLogRepository) {}

  log(
    organizationId: string,
    userId: string | undefined,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Prisma.InputJsonValue
  ) {
    return this._auditLogRepository.create(
      organizationId,
      userId,
      action,
      entityType,
      entityId,
      metadata
    );
  }

  getRecent(organizationId: string) {
    return this._auditLogRepository.getRecent(organizationId);
  }
}
