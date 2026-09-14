import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { SalesSettingsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/settings.service';
import { SalesAuditLogService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/audit-log.service';
import { UpdateSalesSettingsDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/settings.dto';
import { assertSalesBrainAdmin } from '@gitroom/nestjs-libraries/sales-brain/permissions';

@ApiTags('Sales Brain')
@Controller('/sales-brain/settings')
export class SalesBrainSettingsController {
  constructor(
    private _settingsService: SalesSettingsService,
    private _auditLogService: SalesAuditLogService
  ) {}

  @Get('/')
  getSettings(@GetOrgFromRequest() org: Organization) {
    return this._settingsService.getSettings(org.id);
  }

  @Put('/')
  async updateSettings(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: UpdateSalesSettingsDto
  ) {
    assertSalesBrainAdmin(org);
    const result = await this._settingsService.updateSettings(org.id, body);
    await this._auditLogService.log(
      org.id,
      user.id,
      'update',
      'settings',
      undefined,
      body as any
    );
    return result;
  }
}
