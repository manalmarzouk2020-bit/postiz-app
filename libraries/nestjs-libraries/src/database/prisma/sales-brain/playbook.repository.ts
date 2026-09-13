import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesPlaybookRepository {
  constructor(private _playbook: PrismaRepository<'salesPlaybook'>) {}

  get(organizationId: string) {
    return this._playbook.model.salesPlaybook.findUnique({
      where: { organizationId },
    });
  }

  upsert(organizationId: string, content: Prisma.InputJsonValue) {
    return this._playbook.model.salesPlaybook.upsert({
      where: { organizationId },
      create: { organizationId, content },
      update: { content, generatedAt: new Date() },
    });
  }
}
