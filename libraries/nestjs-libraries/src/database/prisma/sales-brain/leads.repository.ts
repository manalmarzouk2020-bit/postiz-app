import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateLeadDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/lead.dto';
import { Prisma, SalesBuyingStage, SalesChannel, SalesPipelineStage } from '@prisma/client';

@Injectable()
export class SalesLeadsRepository {
  constructor(private _lead: PrismaRepository<'salesLead'>) {}

  getLeads(organizationId: string) {
    return this._lead.model.salesLead.findMany({
      where: { organizationId, deletedAt: null },
      include: { productInterest: { select: { id: true, name: true } } },
      orderBy: { leadScore: 'desc' },
    });
  }

  getLead(organizationId: string, id: string) {
    return this._lead.model.salesLead.findFirst({
      where: { organizationId, id, deletedAt: null },
      include: {
        productInterest: { select: { id: true, name: true } },
        conversations: {
          orderBy: { createdAt: 'asc' },
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
            analysis: true,
          },
        },
        followups: { orderBy: { scheduledAt: 'asc' } },
        decisions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  createLead(organizationId: string, body: CreateLeadDto) {
    return this._lead.model.salesLead.create({
      data: {
        organizationId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        source: body.source,
        productInterestId: body.productInterestId,
        intent: body.intent,
      },
    });
  }

  updateAfterDecision(
    organizationId: string,
    id: string,
    data: {
      buyingStage: SalesBuyingStage;
      pipelineStage: SalesPipelineStage;
      leadScore: number;
      painScore: number;
      urgency: string;
      budgetSignal: string;
      authorityLevel: string;
      objections: Prisma.InputJsonValue;
      painPoints: Prisma.InputJsonValue;
      productInterestId?: string;
    }
  ) {
    return this._lead.model.salesLead.update({
      where: { id, organizationId },
      data,
    });
  }

  async findOrCreateByContact(
    organizationId: string,
    contact: {
      name?: string;
      email?: string;
      phone?: string;
      externalContactId?: string;
    },
    source: SalesChannel
  ) {
    const orConditions = [
      ...(contact.phone ? [{ phone: contact.phone }] : []),
      ...(contact.email ? [{ email: contact.email }] : []),
      ...(contact.externalContactId
        ? [{ externalContactId: contact.externalContactId }]
        : []),
    ];

    if (orConditions.length) {
      const existing = await this._lead.model.salesLead.findFirst({
        where: { organizationId, deletedAt: null, OR: orConditions },
      });
      if (existing) {
        return existing;
      }
    }

    return this._lead.model.salesLead.create({
      data: {
        organizationId,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        externalContactId: contact.externalContactId,
        source,
      },
    });
  }

  getDashboardStats(organizationId: string) {
    return this._lead.model.salesLead.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        leadScore: true,
        pipelineStage: true,
        buyingStage: true,
        updatedAt: true,
      },
    });
  }

  getForecastData(organizationId: string) {
    return this._lead.model.salesLead.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        pipelineStage: true,
        leadScore: true,
        productInterest: { select: { price: true } },
      },
    });
  }

  getAllForSummary(organizationId: string) {
    return this._lead.model.salesLead.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        leadScore: true,
        pipelineStage: true,
        buyingStage: true,
        urgency: true,
        budgetSignal: true,
        objections: true,
        painPoints: true,
      },
      take: 500,
    });
  }
}
