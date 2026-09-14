import { Injectable, Logger } from '@nestjs/common';
import { SalesAutomationsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/automations.repository';
import { NotificationService } from '@gitroom/nestjs-libraries/database/prisma/notifications/notification.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from '@gitroom/nestjs-libraries/dtos/sales-brain/automation.dto';
import { Prisma, SalesAutomationRule } from '@prisma/client';

export interface AutomationEvalContext {
  leadScore: number;
  buyingStage: string;
  pipelineStage: string;
  objections: Array<{ category?: string; rawText?: string }>;
  shouldEscalateToHuman: boolean;
}

@Injectable()
export class SalesAutomationsService {
  private readonly logger = new Logger(SalesAutomationsService.name);

  constructor(
    private _automationsRepository: SalesAutomationsRepository,
    private _notificationService: NotificationService
  ) {}

  getRules(organizationId: string) {
    return this._automationsRepository.getRules(organizationId);
  }

  create(organizationId: string, body: CreateAutomationRuleDto) {
    return this._automationsRepository.create(organizationId, body);
  }

  update(organizationId: string, id: string, body: UpdateAutomationRuleDto) {
    return this._automationsRepository.update(organizationId, id, body);
  }

  delete(organizationId: string, id: string) {
    return this._automationsRepository.delete(organizationId, id);
  }

  private matches(rule: SalesAutomationRule, context: AutomationEvalContext): boolean {
    const value = (rule.triggerValue as Record<string, unknown>) || {};
    switch (rule.triggerType) {
      case 'LEAD_SCORE_ABOVE':
        return context.leadScore > (Number(value.threshold) || 80);
      case 'BUYING_STAGE_EQUALS':
        return context.buyingStage === value.stage;
      case 'PIPELINE_STAGE_EQUALS':
        return context.pipelineStage === value.stage;
      case 'OBJECTION_DETECTED':
        return context.objections.some(
          (o) => !value.category || o.category === value.category
        );
      case 'HANDOFF_NEEDED':
        return context.shouldEscalateToHuman;
      default:
        return false;
    }
  }

  private async fire(
    rule: SalesAutomationRule,
    organizationId: string,
    leadId: string,
    context: AutomationEvalContext
  ) {
    const actionValue = (rule.actionValue as Record<string, unknown>) || {};
    let result: Record<string, unknown>;

    if (rule.actionType === 'SEND_NOTIFICATION') {
      const message =
        (actionValue.message as string) ||
        `Automation "${rule.name}" triggered for a lead (score ${context.leadScore}, stage ${context.buyingStage}).`;
      await this._notificationService.inAppNotification(
        organizationId,
        rule.name,
        message,
        !!actionValue.sendEmail
      );
      result = { notified: true };
    } else {
      const url = actionValue.url as string;
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule: rule.name, leadId, context }),
        });
        result = { called: true, url };
      } catch (error) {
        result = { called: false, url, error: (error as Error).message };
      }
    }

    await this._automationsRepository.createLog(
      organizationId,
      rule.id,
      leadId,
      result as Prisma.InputJsonValue
    );
  }

  async evaluateAndFire(
    organizationId: string,
    leadId: string,
    context: AutomationEvalContext
  ) {
    const rules = await this._automationsRepository.getActiveRules(organizationId);
    for (const rule of rules) {
      try {
        if (this.matches(rule, context)) {
          await this.fire(rule, organizationId, leadId, context);
        }
      } catch (error) {
        this.logger.error(
          `Automation rule ${rule.id} failed: ${(error as Error).message}`
        );
      }
    }
  }
}
