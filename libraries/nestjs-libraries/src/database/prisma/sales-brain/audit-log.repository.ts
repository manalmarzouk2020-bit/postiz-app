import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesAuditLogRepository {
  constructor(private _log: PrismaRepository<'salesAuditLog'>) {}

  create(
    organizationId: string,
    userId: string | undefined,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Prisma.InputJsonValue
  ) {
    return this._log.model.salesAuditLog.create({
      data: { organizationId, userId, action, entityType, entityId, metadata },
    });
  }

  getRecent(organizationId: string) {
    return this._log.model.salesAuditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
