import { Injectable } from '@nestjs/common';
import { SalesLeadsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/leads.repository';
import { CreateLeadDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/lead.dto';
import { leadScoreBand } from '@gitroom/nestjs-libraries/sales-brain/lead-scoring';

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
}
