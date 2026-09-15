import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { ChannelCredentialsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/channel-credentials.service';
import { SalesAuditLogService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/audit-log.service';
import {
  UpdateMetaCredentialDto,
  UpdateTelegramCredentialDto,
} from '@gitroom/nestjs-libraries/dtos/sales-brain/channel-credentials.dto';
import { assertSalesBrainAdmin } from '@gitroom/nestjs-libraries/sales-brain/permissions';

@ApiTags('Sales Brain')
@Controller('/sales-brain/channels')
export class SalesBrainChannelCredentialsController {
  constructor(
    private _credentialsService: ChannelCredentialsService,
    private _auditLogService: SalesAuditLogService
  ) {}

  @Get('/meta')
  getMeta(@GetOrgFromRequest() org: Organization) {
    return this._credentialsService.getMeta(org.id, org.apiKey!);
  }

  @Put('/meta')
  async updateMeta(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: UpdateMetaCredentialDto
  ) {
    assertSalesBrainAdmin(org);
    const result = await this._credentialsService.updateMeta(org.id, body);
    await this._auditLogService.log(org.id, user.id, 'update', 'meta_channel_credentials');
    return this._credentialsService.getMeta(org.id, org.apiKey!);
  }

  @Get('/telegram')
  getTelegram(@GetOrgFromRequest() org: Organization) {
    return this._credentialsService.getTelegram(org.id, org.apiKey!);
  }

  @Put('/telegram')
  async updateTelegram(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: UpdateTelegramCredentialDto
  ) {
    assertSalesBrainAdmin(org);
    await this._credentialsService.updateTelegram(org.id, body);
    await this._auditLogService.log(org.id, user.id, 'update', 'telegram_channel_credentials');
    return this._credentialsService.getTelegram(org.id, org.apiKey!);
  }
}
