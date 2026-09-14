import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Prisma, RoleplayMessageRole, RoleplayPersona } from '@prisma/client';

@Injectable()
export class RoleplayRepository {
  constructor(
    private _session: PrismaRepository<'roleplaySession'>,
    private _message: PrismaRepository<'roleplayMessage'>
  ) {}

  getSessions(organizationId: string) {
    return this._session.model.roleplaySession.findMany({
      where: { organizationId },
      include: { salesperson: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createSession(
    organizationId: string,
    persona: RoleplayPersona,
    salespersonId?: string
  ) {
    return this._session.model.roleplaySession.create({
      data: { organizationId, persona, salespersonId },
    });
  }

  getSession(organizationId: string, id: string) {
    return this._session.model.roleplaySession.findFirst({
      where: { organizationId, id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  addMessage(sessionId: string, role: RoleplayMessageRole, content: string) {
    return this._message.model.roleplayMessage.create({
      data: { sessionId, role, content },
    });
  }

  completeSession(
    organizationId: string,
    id: string,
    score: number,
    feedback: Prisma.InputJsonValue
  ) {
    return this._session.model.roleplaySession.update({
      where: { id, organizationId },
      data: { status: 'COMPLETED', score, feedback },
    });
  }
}
