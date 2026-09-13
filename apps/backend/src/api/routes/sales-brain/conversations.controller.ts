import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesConversationsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/conversations.service';
import { SendMessageDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/lead.dto';

@ApiTags('Sales Brain')
@Controller('/sales-brain')
export class SalesBrainConversationsController {
  constructor(private _conversationsService: SalesConversationsService) {}

  @Get('/handoffs')
  getHandoffs(@GetOrgFromRequest() org: Organization) {
    return this._conversationsService.getHandoffs(org.id);
  }

  @Post('/handoffs/:conversationId/resolve')
  resolveHandoff(
    @GetOrgFromRequest() org: Organization,
    @Param('conversationId') conversationId: string
  ) {
    return this._conversationsService.resolveHandoff(org.id, conversationId);
  }

  @Post('/conversations/:conversationId/human-message')
  sendHumanMessage(
    @GetOrgFromRequest() org: Organization,
    @Param('conversationId') conversationId: string,
    @Body() body: SendMessageDto
  ) {
    return this._conversationsService.sendHumanMessage(
      org.id,
      conversationId,
      body.content
    );
  }

  @Post('/messages/:messageId/approve')
  approveDraft(
    @GetOrgFromRequest() org: Organization,
    @Param('messageId') messageId: string
  ) {
    return this._conversationsService.approveDraft(org.id, messageId);
  }

  @Delete('/messages/:messageId')
  rejectDraft(
    @GetOrgFromRequest() org: Organization,
    @Param('messageId') messageId: string
  ) {
    return this._conversationsService.rejectDraft(org.id, messageId);
  }
}
