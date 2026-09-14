import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesExperimentsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/experiments.service';
import { CreateExperimentDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/experiment.dto';

@ApiTags('Sales Brain')
@Controller('/sales-brain/experiments')
export class SalesBrainExperimentsController {
  constructor(private _experimentsService: SalesExperimentsService) {}

  @Get('/')
  getExperiments(@GetOrgFromRequest() org: Organization) {
    return this._experimentsService.getExperiments(org.id);
  }

  @Post('/')
  create(@GetOrgFromRequest() org: Organization, @Body() body: CreateExperimentDto) {
    return this._experimentsService.create(org.id, body);
  }

  @Post('/:id/complete')
  complete(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._experimentsService.complete(org.id, id);
  }

  @Get('/:id/results')
  getResults(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._experimentsService.getResults(org.id, id);
  }
}
