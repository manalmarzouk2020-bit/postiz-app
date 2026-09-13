import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesSettingsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/settings.service';
import { UpdateSalesSettingsDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/settings.dto';

@ApiTags('Sales Brain')
@Controller('/sales-brain/settings')
export class SalesBrainSettingsController {
  constructor(private _settingsService: SalesSettingsService) {}

  @Get('/')
  getSettings(@GetOrgFromRequest() org: Organization) {
    return this._settingsService.getSettings(org.id);
  }

  @Put('/')
  updateSettings(
    @GetOrgFromRequest() org: Organization,
    @Body() body: UpdateSalesSettingsDto
  ) {
    return this._settingsService.updateSettings(org.id, body);
  }
}
