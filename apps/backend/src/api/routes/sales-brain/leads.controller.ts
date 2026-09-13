import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesLeadsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/leads.service';
import { SalesBrainEngineService } from '@gitroom/nestjs-libraries/sales-brain/sales-brain-engine.service';
import {
  CreateLeadDto,
  SendMessageDto,
} from '@gitroom/nestjs-libraries/dtos/sales-brain/lead.dto';

@ApiTags('Sales Brain')
@Controller('/sales-brain/leads')
export class SalesBrainLeadsController {
  constructor(
    private _leadsService: SalesLeadsService,
    private _salesBrainEngine: SalesBrainEngineService
  ) {}

  @Get('/dashboard')
  getDashboard(@GetOrgFromRequest() org: Organization) {
    return this._leadsService.getDashboard(org.id);
  }

  @Get('/')
  getLeads(@GetOrgFromRequest() org: Organization) {
    return this._leadsService.getLeads(org.id);
  }

  @Get('/:id')
  getLead(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._leadsService.getLead(org.id, id);
  }

  @Post('/')
  createLead(@GetOrgFromRequest() org: Organization, @Body() body: CreateLeadDto) {
    return this._leadsService.createLead(org.id, body);
  }

  @Post('/:id/messages')
  sendMessage(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: SendMessageDto
  ) {
    return this._salesBrainEngine.processIncomingMessage(
      org.id,
      id,
      org.name,
      body.content
    );
  }
}
