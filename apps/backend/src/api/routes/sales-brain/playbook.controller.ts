import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesPlaybookService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/playbook.service';

@ApiTags('Sales Brain')
@Controller('/sales-brain/playbook')
export class SalesBrainPlaybookController {
  constructor(private _playbookService: SalesPlaybookService) {}

  @Get('/')
  getPlaybook(@GetOrgFromRequest() org: Organization) {
    return this._playbookService.getPlaybook(org.id);
  }

  @Post('/generate')
  generatePlaybook(@GetOrgFromRequest() org: Organization) {
    return this._playbookService.generatePlaybook(org.id, org.name);
  }
}
