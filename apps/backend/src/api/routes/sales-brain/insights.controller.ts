import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesInsightsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/insights.service';

@ApiTags('Sales Brain')
@Controller('/sales-brain/insights')
export class SalesBrainInsightsController {
  constructor(private _insightsService: SalesInsightsService) {}

  @Get('/')
  getLatest(@GetOrgFromRequest() org: Organization) {
    return this._insightsService.getLatest(org.id);
  }

  @Post('/generate')
  generate(@GetOrgFromRequest() org: Organization) {
    return this._insightsService.generate(org.id);
  }
}
