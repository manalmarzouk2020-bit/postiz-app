import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Injectable()
export class SalesAnalyticsRepository {
  constructor(
    private _conversation: PrismaRepository<'salesConversation'>,
    private _message: PrismaRepository<'salesMessage'>,
    private _decision: PrismaRepository<'salesAiDecision'>,
    private _lead: PrismaRepository<'salesLead'>,
    private _automationLog: PrismaRepository<'salesAutomationLog'>,
    private _followup: PrismaRepository<'salesFollowup'>,
    private _analysis: PrismaRepository<'salesConversationAnalysis'>
  ) {}

  getConversationCount(organizationId: string) {
    return this._conversation.model.salesConversation.count({ where: { organizationId } });
  }

  getHandoffCounts(organizationId: string) {
    return Promise.all([
      this._conversation.model.salesConversation.count({
        where: { organizationId, needsHumanAttention: true },
      }),
      this._conversation.model.salesConversation.count({ where: { organizationId } }),
    ]);
  }

  getMessageCountsByRole(organizationId: string) {
    return this._message.model.salesMessage.groupBy({
      by: ['role'],
      where: { conversation: { organizationId } },
      _count: { _all: true },
    });
  }

  getDecisionCount(organizationId: string) {
    return this._decision.model.salesAiDecision.count({ where: { organizationId } });
  }

  async getWonDealsWithRevenueSplit(organizationId: string) {
    const wonLeads = await this._lead.model.salesLead.findMany({
      where: { organizationId, pipelineStage: 'WON', deletedAt: null },
      select: {
        id: true,
        productInterest: { select: { price: true } },
        conversations: { select: { messages: { select: { role: true }, take: 1, where: { role: 'HUMAN' } } } },
      },
    });

    let aiGeneratedRevenue = 0;
    let aiAssistedRevenue = 0;
    let totalRevenue = 0;

    for (const lead of wonLeads) {
      const price = lead.productInterest?.price ?? 0;
      totalRevenue += price;
      const hadHuman = lead.conversations.some((c) => c.messages.length > 0);
      if (hadHuman) {
        aiAssistedRevenue += price;
      } else {
        aiGeneratedRevenue += price;
      }
    }

    return {
      dealsWon: wonLeads.length,
      totalRevenue,
      aiGeneratedRevenue,
      aiAssistedRevenue,
    };
  }

  getAutomationFireCount(organizationId: string) {
    return this._automationLog.model.salesAutomationLog.count({ where: { organizationId } });
  }

  getFollowupsSentCount(organizationId: string) {
    return this._followup.model.salesFollowup.count({
      where: { organizationId, status: 'SENT' },
    });
  }

  async getAverageConversationScore(organizationId: string) {
    const result = await this._analysis.model.salesConversationAnalysis.aggregate({
      where: { organizationId },
      _avg: { score: true },
      _count: { _all: true },
    });
    return { average: result._avg.score, sampleSize: result._count._all };
  }

  async getAverageResponseTimeSeconds(organizationId: string) {
    const conversations = await this._conversation.model.salesConversation.findMany({
      where: { organizationId },
      select: {
        messages: {
          select: { role: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      take: 200,
      orderBy: { createdAt: 'desc' },
    });

    const gaps: number[] = [];
    for (const conversation of conversations) {
      const messages = conversation.messages;
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].role === 'LEAD' && messages[i + 1].role === 'AI') {
          const gap =
            (messages[i + 1].createdAt.getTime() - messages[i].createdAt.getTime()) / 1000;
          if (gap >= 0) {
            gaps.push(gap);
          }
        }
      }
    }

    if (!gaps.length) {
      return { average: null, sampleSize: 0 };
    }
    return {
      average: gaps.reduce((a, b) => a + b, 0) / gaps.length,
      sampleSize: gaps.length,
    };
  }
}
