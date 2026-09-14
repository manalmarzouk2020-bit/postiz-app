import { Injectable } from '@nestjs/common';
import { SalesInsightsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/insights.repository';
import { SalesLeadsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/leads.service';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesInsightsService {
  constructor(
    private _insightsRepository: SalesInsightsRepository,
    private _leadsService: SalesLeadsService,
    private _openaiService: OpenaiService
  ) {}

  getLatest(organizationId: string) {
    return this._insightsRepository.getLatest(organizationId);
  }

  async generate(organizationId: string) {
    const summary = await this._leadsService.getBusinessDataSummary(organizationId);
    const insights = await this._openaiService.generateInsights(summary);
    return this._insightsRepository.create(
      organizationId,
      insights as unknown as Prisma.InputJsonValue
    );
  }
}
