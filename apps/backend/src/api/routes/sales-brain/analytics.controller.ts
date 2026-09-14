import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesAnalyticsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/analytics.service';

@ApiTags('Sales Brain')
@Controller('/sales-brain/analytics')
export class SalesBrainAnalyticsController {
  constructor(private _analyticsService: SalesAnalyticsService) {}

  @Get('/performance')
  getPerformance(@GetOrgFromRequest() org: Organization) {
    return this._analyticsService.getPerformance(org.id);
  }
}
