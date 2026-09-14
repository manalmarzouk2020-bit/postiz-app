import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { SalesPlaybookService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/playbook.service';
import { SalesAuditLogService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/audit-log.service';
import { assertSalesBrainAdmin } from '@gitroom/nestjs-libraries/sales-brain/permissions';

@ApiTags('Sales Brain')
@Controller('/sales-brain/playbook')
export class SalesBrainPlaybookController {
  constructor(
    private _playbookService: SalesPlaybookService,
    private _auditLogService: SalesAuditLogService
  ) {}

  @Get('/')
  getPlaybook(@GetOrgFromRequest() org: Organization) {
    return this._playbookService.getPlaybook(org.id);
  }

  @Post('/generate')
  async generatePlaybook(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User
  ) {
    assertSalesBrainAdmin(org);
    const playbook = await this._playbookService.generatePlaybook(org.id, org.name);
    await this._auditLogService.log(org.id, user.id, 'generate', 'playbook');
    return playbook;
  }
}
