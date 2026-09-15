import {
  Controller,
  Post,
  Param,
  Req,
  NotFoundException,
  ForbiddenException,
  HttpCode,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationService } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.service';
import { ChannelCredentialsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/channel-credentials.repository';
import { SalesLeadsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/leads.service';
import { SalesBrainEngineService } from '@gitroom/nestjs-libraries/sales-brain/sales-brain-engine.service';

interface TelegramUpdate {
  message?: {
    chat?: { id?: number | string };
    from?: { first_name?: string; last_name?: string; username?: string };
    text?: string;
  };
}

/**
 * One Telegram bot = one webhook, no shared-callback ambiguity like Meta.
 * The client creates their own bot via @BotFather and points it at this URL
 * (scoped by their organization's API key); Telegram authenticates the
 * request with the secret token it echoes back on every delivery.
 */
@ApiTags('Sales Brain')
@Controller('/sales-brain/channels/telegram')
export class SalesBrainTelegramWebhookController {
  constructor(
    private _organizationService: OrganizationService,
    private _credentialsRepository: ChannelCredentialsRepository,
    private _leadsService: SalesLeadsService,
    private _salesBrainEngine: SalesBrainEngineService
  ) {}

  @Post('/:apiKey/webhook')
  @HttpCode(200)
  async receive(@Param('apiKey') apiKey: string, @Req() req: Request) {
    const org = await this._organizationService.getOrgByApiKey(apiKey);
    if (!org) {
      throw new NotFoundException('Unknown organization API key');
    }

    const creds = await this._credentialsRepository.getTelegram(org.id);
    if (!creds) {
      return { success: false, reason: 'Telegram bot is not connected for this organization' };
    }

    if (creds.webhookSecret) {
      // @ts-ignore
      const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
      if (secretHeader !== creds.webhookSecret) {
        throw new ForbiddenException('Invalid webhook secret token');
      }
    }

    // @ts-ignore
    const update: TelegramUpdate = req.body;
    const message = update.message;
    const chatId = message?.chat?.id;
    if (!message?.text || chatId === undefined) {
      return { success: false, reason: 'No recognizable message in update' };
    }

    const name = [message.from?.first_name, message.from?.last_name]
      .filter(Boolean)
      .join(' ') || message.from?.username;

    const lead = await this._leadsService.findOrCreateByContact(
      org.id,
      { name, externalContactId: String(chatId) },
      'TELEGRAM'
    );

    const result = await this._salesBrainEngine.processIncomingMessage(
      org.id,
      lead.id,
      org.name,
      message.text
    );

    return { success: true, leadId: lead.id, ...result };
  }
}
