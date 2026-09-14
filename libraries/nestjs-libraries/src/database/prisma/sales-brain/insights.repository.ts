import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesInsightsRepository {
  constructor(private _insight: PrismaRepository<'salesInsight'>) {}

  getLatest(organizationId: string) {
    return this._insight.model.salesInsight.findFirst({
      where: { organizationId },
      orderBy: { generatedAt: 'desc' },
    });
  }

  create(organizationId: string, content: Prisma.InputJsonValue) {
    return this._insight.model.salesInsight.create({
      data: { organizationId, content },
    });
  }
}
