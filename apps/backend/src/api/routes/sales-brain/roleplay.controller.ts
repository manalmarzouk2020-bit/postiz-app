import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { RoleplayService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/roleplay.service';
import {
  RoleplayReplyDto,
  StartRoleplayDto,
} from '@gitroom/nestjs-libraries/dtos/sales-brain/roleplay.dto';

@ApiTags('Sales Brain')
@Controller('/sales-brain/roleplay')
export class SalesBrainRoleplayController {
  constructor(private _roleplayService: RoleplayService) {}

  @Get('/')
  getSessions(@GetOrgFromRequest() org: Organization) {
    return this._roleplayService.getSessions(org.id);
  }

  @Get('/:id')
  getSession(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._roleplayService.getSession(org.id, id);
  }

  @Post('/')
  startSession(@GetOrgFromRequest() org: Organization, @Body() body: StartRoleplayDto) {
    return this._roleplayService.startSession(org.id, body.persona, body.salespersonId);
  }

  @Post('/:id/reply')
  reply(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: RoleplayReplyDto
  ) {
    return this._roleplayService.reply(org.id, id, body.content);
  }

  @Post('/:id/complete')
  complete(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._roleplayService.complete(org.id, id);
  }
}
