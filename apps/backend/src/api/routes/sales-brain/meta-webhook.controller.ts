import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  RawBodyRequest,
  NotFoundException,
  ForbiddenException,
  HttpCode,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { OrganizationService } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.service';
import { ChannelCredentialsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/channel-credentials.repository';
import { SalesLeadsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/leads.service';
import { SalesBrainEngineService } from '@gitroom/nestjs-libraries/sales-brain/sales-brain-engine.service';
import { SalesChannel } from '@prisma/client';

interface ExtractedInbound {
  channel: SalesChannel;
  contact: { name?: string; phone?: string; externalContactId?: string };
  content: string;
}

function extractWhatsapp(body: any): ExtractedInbound[] {
  const out: ExtractedInbound[] = [];
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        if (!message?.text?.body) continue;
        const profile = (value.contacts || []).find(
          (c: any) => c.wa_id === message.from
        );
        out.push({
          channel: 'WHATSAPP',
          contact: {
            phone: message.from,
            name: profile?.profile?.name,
            externalContactId: message.from,
          },
          content: message.text.body,
        });
      }
    }
  }
  return out;
}

function extractMessaging(
  body: any,
  channel: SalesChannel
): ExtractedInbound[] {
  const out: ExtractedInbound[] = [];
  for (const entry of body.entry || []) {
    for (const messaging of entry.messaging || []) {
      const text = messaging?.message?.text;
      const senderId = messaging?.sender?.id;
      if (!text || !senderId || messaging?.message?.is_echo) continue;
      out.push({
        channel,
        contact: { externalContactId: senderId },
        content: text,
      });
    }
  }
  return out;
}

function extractInbound(body: any): ExtractedInbound[] {
  switch (body?.object) {
    case 'whatsapp_business_account':
      return extractWhatsapp(body);
    case 'page':
      return extractMessaging(body, 'FACEBOOK_MESSENGER');
    case 'instagram':
      return extractMessaging(body, 'INSTAGRAM');
    default:
      return [];
  }
}

/**
 * One Meta App (created in the client's own developer account) covers
 * WhatsApp, Messenger and Instagram DMs at once - Meta only allows a single
 * callback URL + verify token per app, differentiating the payload by
 * `body.object`. Each organization points its own Meta App at this same
 * path (scoped by their API key), so no cross-tenant routing is needed.
 */
@ApiTags('Sales Brain')
@Controller('/sales-brain/channels/meta')
export class SalesBrainMetaWebhookController {
  constructor(
    private _organizationService: OrganizationService,
    private _credentialsRepository: ChannelCredentialsRepository,
    private _leadsService: SalesLeadsService,
    private _salesBrainEngine: SalesBrainEngineService
  ) {}

  @Get('/:apiKey/webhook')
  async verify(
    @Param('apiKey') apiKey: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string
  ) {
    const org = await this._organizationService.getOrgByApiKey(apiKey);
    if (!org) {
      throw new NotFoundException('Unknown organization API key');
    }

    const creds = await this._credentialsRepository.getMeta(org.id);
    if (
      mode !== 'subscribe' ||
      !creds?.verifyToken ||
      creds.verifyToken !== verifyToken
    ) {
      throw new ForbiddenException('Verification token mismatch');
    }

    return challenge;
  }

  @Post('/:apiKey/webhook')
  @HttpCode(200)
  async receive(
    @Param('apiKey') apiKey: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    const org = await this._organizationService.getOrgByApiKey(apiKey);
    if (!org) {
      throw new NotFoundException('Unknown organization API key');
    }

    const creds = await this._credentialsRepository.getMeta(org.id);
    if (!creds) {
      return { success: false, reason: 'Meta app is not connected for this organization' };
    }

    if (creds.appSecret) {
      // @ts-ignore
      const signature = req.headers['x-hub-signature-256'] as string | undefined;
      if (!signature || !req.rawBody) {
        throw new ForbiddenException('Missing signature');
      }
      const expected =
        'sha256=' +
        crypto
          .createHmac('sha256', creds.appSecret)
          .update(req.rawBody)
          .digest('hex');
      const valid =
        signature.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      if (!valid) {
        throw new ForbiddenException('Invalid signature');
      }
    }

    // @ts-ignore
    const body = req.body;
    const messages = extractInbound(body);

    for (const message of messages) {
      const lead = await this._leadsService.findOrCreateByContact(
        org.id,
        message.contact,
        message.channel
      );
      await this._salesBrainEngine.processIncomingMessage(
        org.id,
        lead.id,
        org.name,
        message.content
      );
    }

    return { success: true, processed: messages.length };
  }
}
