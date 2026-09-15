import { Injectable } from '@nestjs/common';
import { SalesLeadsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/leads.repository';
import { CreateLeadDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/lead.dto';
import { leadScoreBand } from '@gitroom/nestjs-libraries/sales-brain/lead-scoring';
import { calculateForecast } from '@gitroom/nestjs-libraries/sales-brain/forecasting';
import { SalesChannel } from '@prisma/client';

@Injectable()
export class SalesLeadsService {
  constructor(private _leadsRepository: SalesLeadsRepository) {}

  getLeads(organizationId: string) {
    return this._leadsRepository.getLeads(organizationId);
  }

  getLead(organizationId: string, id: string) {
    return this._leadsRepository.getLead(organizationId, id);
  }

  createLead(organizationId: string, body: CreateLeadDto) {
    return this._leadsRepository.createLead(organizationId, body);
  }

  findOrCreateByContact(
    organizationId: string,
    contact: {
      name?: string;
      email?: string;
      phone?: string;
      externalContactId?: string;
    },
    source: SalesChannel
  ) {
    return this._leadsRepository.findOrCreateByContact(organizationId, contact, source);
  }

  async getDashboard(organizationId: string) {
    const leads = await this._leadsRepository.getDashboardStats(organizationId);

    const byPipelineStage: Record<string, number> = {};
    const byScoreBand: Record<string, number> = {
      cold: 0,
      low_intent: 0,
      potential: 0,
      qualified: 0,
      hot: 0,
    };

    for (const lead of leads) {
      byPipelineStage[lead.pipelineStage] = (byPipelineStage[lead.pipelineStage] || 0) + 1;
      byScoreBand[leadScoreBand(lead.leadScore)] += 1;
    }

    const hotLeads = [...leads]
      .sort((a, b) => b.leadScore - a.leadScore)
      .slice(0, 10);

    return {
      totalLeads: leads.length,
      byPipelineStage,
      byScoreBand,
      hotLeads,
    };
  }

  async getForecast(organizationId: string) {
    const leads = await this._leadsRepository.getForecastData(organizationId);
    return calculateForecast(
      leads.map((lead) => ({
        pipelineStage: lead.pipelineStage,
        leadScore: lead.leadScore,
        price: lead.productInterest?.price ?? null,
      }))
    );
  }

  async getBusinessDataSummary(organizationId: string): Promise<string> {
    const leads = await this._leadsRepository.getAllForSummary(organizationId);

    const byPipelineStage: Record<string, number> = {};
    const byScoreBand: Record<string, number> = {};
    const objectionCounts: Record<string, number> = {};
    const painCounts: Record<string, number> = {};

    for (const lead of leads) {
      byPipelineStage[lead.pipelineStage] = (byPipelineStage[lead.pipelineStage] || 0) + 1;
      const band = leadScoreBand(lead.leadScore);
      byScoreBand[band] = (byScoreBand[band] || 0) + 1;

      for (const objection of (lead.objections as any[]) || []) {
        const key = objection?.category || 'uncategorized';
        objectionCounts[key] = (objectionCounts[key] || 0) + 1;
      }
      for (const pain of (lead.painPoints as any[]) || []) {
        const key = pain?.problem || 'unspecified';
        painCounts[key] = (painCounts[key] || 0) + 1;
      }
    }

    const topEntries = (record: Record<string, number>, n: number) =>
      Object.entries(record)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([k, v]) => `${k} (${v})`)
        .join(', ') || 'none recorded yet';

    return [
      `Total leads: ${leads.length}`,
      `Pipeline stage counts: ${JSON.stringify(byPipelineStage)}`,
      `Lead score bands: ${JSON.stringify(byScoreBand)}`,
      `Top objections: ${topEntries(objectionCounts, 5)}`,
      `Top pain points: ${topEntries(painCounts, 5)}`,
    ].join('\n');
  }
}
