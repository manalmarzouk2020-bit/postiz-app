import { Injectable } from '@nestjs/common';
import { SalesAnalyticsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/analytics.repository';

@Injectable()
export class SalesAnalyticsService {
  constructor(private _analyticsRepository: SalesAnalyticsRepository) {}

  async getPerformance(organizationId: string) {
    const [
      conversationCount,
      [handoffCount, handoffDenominator],
      messagesByRole,
      decisionCount,
      revenueSplit,
      automationFireCount,
      followupsSentCount,
      conversationScore,
      responseTime,
    ] = await Promise.all([
      this._analyticsRepository.getConversationCount(organizationId),
      this._analyticsRepository.getHandoffCounts(organizationId),
      this._analyticsRepository.getMessageCountsByRole(organizationId),
      this._analyticsRepository.getDecisionCount(organizationId),
      this._analyticsRepository.getWonDealsWithRevenueSplit(organizationId),
      this._analyticsRepository.getAutomationFireCount(organizationId),
      this._analyticsRepository.getFollowupsSentCount(organizationId),
      this._analyticsRepository.getAverageConversationScore(organizationId),
      this._analyticsRepository.getAverageResponseTimeSeconds(organizationId),
    ]);

    const messageCounts: Record<string, number> = {};
    for (const row of messagesByRole) {
      messageCounts[row.role] = row._count._all;
    }

    return {
      conversationCount,
      messageCounts,
      decisionCount,
      handoffRate: handoffDenominator ? handoffCount / handoffDenominator : 0,
      ...revenueSplit,
      automationFireCount,
      followupsSentCount,
      averageConversationScore: conversationScore,
      averageResponseTimeSeconds: responseTime,
    };
  }
}
