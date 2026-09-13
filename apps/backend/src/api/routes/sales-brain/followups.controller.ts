import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesFollowupsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/followups.service';

@ApiTags('Sales Brain')
@Controller('/sales-brain/followups')
export class SalesBrainFollowupsController {
  constructor(private _followupsService: SalesFollowupsService) {}

  @Get('/')
  getFollowups(@GetOrgFromRequest() org: Organization) {
    return this._followupsService.getForOrganization(org.id);
  }

  @Post('/:id/cancel')
  cancelFollowup(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._followupsService.cancel(org.id, id);
  }
}
