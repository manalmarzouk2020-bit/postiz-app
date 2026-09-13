import { Body, Controller, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationService } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.service';
import { SalesLeadsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/leads.service';
import { SalesBrainEngineService } from '@gitroom/nestjs-libraries/sales-brain/sales-brain-engine.service';
import { SalesChannel } from '@prisma/client';

const CHANNEL_MAP: Record<string, SalesChannel> = {
  whatsapp: 'WHATSAPP',
  instagram: 'INSTAGRAM',
  messenger: 'FACEBOOK_MESSENGER',
  email: 'EMAIL',
  sms: 'SMS',
  webchat: 'LIVE_CHAT',
  ecommerce: 'ECOMMERCE',
  webhook: 'WEBHOOK',
};

interface InboundPayload {
  contact?: { name?: string; email?: string; phone?: string };
  content?: string;
  // WhatsApp Cloud API webhook shape
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{ from?: string; text?: { body?: string } }>;
        contacts?: Array<{ profile?: { name?: string } }>;
      };
    }>;
  }>;
}

function extractContactAndMessage(body: InboundPayload): {
  contact: { name?: string; email?: string; phone?: string };
  content: string;
} | null {
  if (body.content) {
    return { contact: body.contact || {}, content: body.content };
  }

  const change = body.entry?.[0]?.changes?.[0]?.value;
  const message = change?.messages?.[0];
  if (message?.text?.body) {
    return {
      contact: {
        phone: message.from,
        name: change?.contacts?.[0]?.profile?.name,
      },
      content: message.text.body,
    };
  }

  return null;
}

/**
 * Unauthenticated by session (no live channel connectors exist yet); scoped
 * instead by the organization's own API key in the path, the same pattern
 * used by other no-auth integration callbacks in this backend. Point a real
 * WhatsApp Cloud API / generic webhook at this URL once credentials exist.
 */
@ApiTags('Sales Brain')
@Controller('/sales-brain/inbound')
export class SalesBrainInboundController {
  constructor(
    private _organizationService: OrganizationService,
    private _leadsService: SalesLeadsService,
    private _salesBrainEngine: SalesBrainEngineService
  ) {}

  @Post('/:apiKey/:channel')
  async receive(
    @Param('apiKey') apiKey: string,
    @Param('channel') channel: string,
    @Body() body: InboundPayload
  ) {
    const org = await this._organizationService.getOrgByApiKey(apiKey);
    if (!org) {
      throw new NotFoundException('Unknown organization API key');
    }

    const salesChannel = CHANNEL_MAP[channel.toLowerCase()] || 'WEBHOOK';
    const parsed = extractContactAndMessage(body);
    if (!parsed) {
      return { success: false, reason: 'No recognizable message in payload' };
    }

    const lead = await this._leadsService.findOrCreateByContact(
      org.id,
      parsed.contact,
      salesChannel
    );

    const result = await this._salesBrainEngine.processIncomingMessage(
      org.id,
      lead.id,
      org.name,
      parsed.content
    );

    return { success: true, leadId: lead.id, ...result };
  }
}
