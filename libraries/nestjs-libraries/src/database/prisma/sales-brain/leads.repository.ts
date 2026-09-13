import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateLeadDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/lead.dto';
import { Prisma, SalesBuyingStage, SalesPipelineStage } from '@prisma/client';

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
}
