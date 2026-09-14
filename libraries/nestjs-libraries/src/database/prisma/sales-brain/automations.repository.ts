import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateAutomationRuleDto, UpdateAutomationRuleDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/automation.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesAutomationsRepository {
  constructor(
    private _rule: PrismaRepository<'salesAutomationRule'>,
    private _log: PrismaRepository<'salesAutomationLog'>
  ) {}

  getRules(organizationId: string) {
    return this._rule.model.salesAutomationRule.findMany({
      where: { organizationId },
      include: { _count: { select: { logs: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  getActiveRules(organizationId: string) {
    return this._rule.model.salesAutomationRule.findMany({
      where: { organizationId, isActive: true },
    });
  }

  create(organizationId: string, body: CreateAutomationRuleDto) {
    return this._rule.model.salesAutomationRule.create({
      data: {
        organizationId,
        name: body.name,
        triggerType: body.triggerType,
        triggerValue: body.triggerValue as Prisma.InputJsonValue,
        actionType: body.actionType,
        actionValue: body.actionValue as Prisma.InputJsonValue,
        isActive: body.isActive ?? true,
      },
    });
  }

  update(organizationId: string, id: string, body: UpdateAutomationRuleDto) {
    return this._rule.model.salesAutomationRule.updateMany({
      where: { id, organizationId },
      data: body,
    });
  }

  delete(organizationId: string, id: string) {
    return this._rule.model.salesAutomationRule.deleteMany({
      where: { id, organizationId },
    });
  }

  createLog(
    organizationId: string,
    ruleId: string,
    leadId: string | undefined,
    result: Prisma.InputJsonValue
  ) {
    return this._log.model.salesAutomationLog.create({
      data: { organizationId, ruleId, leadId, result },
    });
  }
}
