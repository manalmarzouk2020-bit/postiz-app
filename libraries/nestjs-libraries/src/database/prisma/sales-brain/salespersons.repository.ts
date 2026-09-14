import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateSalespersonDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/salesperson.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalespersonsRepository {
  constructor(
    private _salesperson: PrismaRepository<'salesperson'>,
    private _message: PrismaRepository<'salesMessage'>,
    private _report: PrismaRepository<'salesCoachingReport'>
  ) {}

  getSalespersons(organizationId: string) {
    return this._salesperson.model.salesperson.findMany({
      where: { organizationId },
      include: { coachingReports: { orderBy: { generatedAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  getSalesperson(organizationId: string, id: string) {
    return this._salesperson.model.salesperson.findFirst({
      where: { organizationId, id },
    });
  }

  create(organizationId: string, body: CreateSalespersonDto) {
    return this._salesperson.model.salesperson.create({
      data: { organizationId, name: body.name, email: body.email },
    });
  }

  async getTranscriptsForSalesperson(organizationId: string, salespersonId: string) {
    const messages = await this._message.model.salesMessage.findMany({
      where: { salespersonId, conversation: { organizationId } },
      select: { conversationId: true },
      distinct: ['conversationId'],
    });
    const conversationIds = messages.map((m) => m.conversationId);
    if (!conversationIds.length) {
      return [];
    }

    const conversations = await this._message.model.salesMessage.findMany({
      where: { conversationId: { in: conversationIds } },
      orderBy: { createdAt: 'asc' },
      select: { conversationId: true, role: true, content: true },
    });

    const byConversation = new Map<string, string[]>();
    for (const message of conversations) {
      const lines = byConversation.get(message.conversationId) || [];
      lines.push(`${message.role}: ${message.content}`);
      byConversation.set(message.conversationId, lines);
    }

    return Array.from(byConversation.values()).map((lines) => lines.join('\n'));
  }

  upsertCoachingReport(
    organizationId: string,
    salespersonId: string,
    content: Prisma.InputJsonValue
  ) {
    return this._report.model.salesCoachingReport.create({
      data: { organizationId, salespersonId, content },
    });
  }

  getLatestCoachingReport(organizationId: string, salespersonId: string) {
    return this._report.model.salesCoachingReport.findFirst({
      where: { organizationId, salespersonId },
      orderBy: { generatedAt: 'desc' },
    });
  }
}
