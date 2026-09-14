import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesAutomationsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/automations.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from '@gitroom/nestjs-libraries/dtos/sales-brain/automation.dto';

@ApiTags('Sales Brain')
@Controller('/sales-brain/automations')
export class SalesBrainAutomationsController {
  constructor(private _automationsService: SalesAutomationsService) {}

  @Get('/')
  getRules(@GetOrgFromRequest() org: Organization) {
    return this._automationsService.getRules(org.id);
  }

  @Post('/')
  createRule(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateAutomationRuleDto
  ) {
    return this._automationsService.create(org.id, body);
  }

  @Put('/:id')
  updateRule(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: UpdateAutomationRuleDto
  ) {
    return this._automationsService.update(org.id, id, body);
  }

  @Delete('/:id')
  deleteRule(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._automationsService.delete(org.id, id);
  }
}
