import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { SalesAutomationsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/automations.service';
import { SalesAuditLogService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/audit-log.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from '@gitroom/nestjs-libraries/dtos/sales-brain/automation.dto';
import { assertSalesBrainAdmin } from '@gitroom/nestjs-libraries/sales-brain/permissions';

@ApiTags('Sales Brain')
@Controller('/sales-brain/automations')
export class SalesBrainAutomationsController {
  constructor(
    private _automationsService: SalesAutomationsService,
    private _auditLogService: SalesAuditLogService
  ) {}

  @Get('/')
  getRules(@GetOrgFromRequest() org: Organization) {
    return this._automationsService.getRules(org.id);
  }

  @Post('/')
  async createRule(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: CreateAutomationRuleDto
  ) {
    assertSalesBrainAdmin(org);
    const rule = await this._automationsService.create(org.id, body);
    await this._auditLogService.log(org.id, user.id, 'create', 'automation_rule', rule.id);
    return rule;
  }

  @Put('/:id')
  async updateRule(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('id') id: string,
    @Body() body: UpdateAutomationRuleDto
  ) {
    assertSalesBrainAdmin(org);
    const result = await this._automationsService.update(org.id, id, body);
    await this._auditLogService.log(org.id, user.id, 'update', 'automation_rule', id, body as any);
    return result;
  }

  @Delete('/:id')
  async deleteRule(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('id') id: string
  ) {
    assertSalesBrainAdmin(org);
    const result = await this._automationsService.delete(org.id, id);
    await this._auditLogService.log(org.id, user.id, 'delete', 'automation_rule', id);
    return result;
  }
}
