import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SalesFollowupsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/followups.service';
import { SalesConversationsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/conversations.repository';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';

/**
 * There is no live outbound channel connector yet (no WhatsApp/IG credentials),
 * so a due follow-up cannot be sent automatically. Instead this drafts the
 * follow-up message and appends it to the conversation as a pending AI draft
 * for a human to review and actually deliver, per the no-fake-autonomy policy.
 */
@Injectable()
export class SalesFollowupsCronService {
  private readonly logger = new Logger(SalesFollowupsCronService.name);

  constructor(
    private _followupsService: SalesFollowupsService,
    private _conversationsRepository: SalesConversationsRepository,
    private _openaiService: OpenaiService
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async processDueFollowups() {
    const due = await this._followupsService.getDue();
    for (const followup of due) {
      try {
        const conversation = await this._conversationsRepository.getOrCreateConversation(
          followup.organizationId,
          followup.leadId,
          followup.lead.source
        );

        const message = await this._openaiService.generateFollowUpMessage(
          'the business',
          {
            name: followup.lead.name,
            buyingStage: followup.lead.buyingStage,
            painPoints: followup.lead.painPoints,
            objections: followup.lead.objections,
          },
          followup.reason || 'Lead went quiet after showing interest'
        );

        await this._conversationsRepository.addMessage(
          conversation.id,
          'AI',
          message,
          { isFollowUp: true, followupId: followup.id },
          true
        );

        await this._followupsService.markSent(followup.id);
      } catch (error) {
        this.logger.error(
          `Failed to process follow-up ${followup.id}: ${(error as Error).message}`
        );
      }
    }
  }
}
