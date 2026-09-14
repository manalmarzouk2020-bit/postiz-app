import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { SalesExperimentsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/experiments.service';
import { SalesAuditLogService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/audit-log.service';
import { CreateExperimentDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/experiment.dto';
import { assertSalesBrainAdmin } from '@gitroom/nestjs-libraries/sales-brain/permissions';

@ApiTags('Sales Brain')
@Controller('/sales-brain/experiments')
export class SalesBrainExperimentsController {
  constructor(
    private _experimentsService: SalesExperimentsService,
    private _auditLogService: SalesAuditLogService
  ) {}

  @Get('/')
  getExperiments(@GetOrgFromRequest() org: Organization) {
    return this._experimentsService.getExperiments(org.id);
  }

  @Post('/')
  async create(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: CreateExperimentDto
  ) {
    assertSalesBrainAdmin(org);
    const experiment = await this._experimentsService.create(org.id, body);
    await this._auditLogService.log(org.id, user.id, 'create', 'experiment', experiment.id);
    return experiment;
  }

  @Post('/:id/complete')
  async complete(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('id') id: string
  ) {
    assertSalesBrainAdmin(org);
    const result = await this._experimentsService.complete(org.id, id);
    await this._auditLogService.log(org.id, user.id, 'complete', 'experiment', id);
    return result;
  }

  @Get('/:id/results')
  getResults(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._experimentsService.getResults(org.id, id);
  }
}
