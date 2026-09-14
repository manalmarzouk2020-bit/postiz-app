import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesAuditLogService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/audit-log.service';
import { assertSalesBrainAdmin } from '@gitroom/nestjs-libraries/sales-brain/permissions';

@ApiTags('Sales Brain')
@Controller('/sales-brain/audit-log')
export class SalesBrainAuditLogController {
  constructor(private _auditLogService: SalesAuditLogService) {}

  @Get('/')
  getRecent(@GetOrgFromRequest() org: Organization) {
    assertSalesBrainAdmin(org);
    return this._auditLogService.getRecent(org.id);
  }
}
