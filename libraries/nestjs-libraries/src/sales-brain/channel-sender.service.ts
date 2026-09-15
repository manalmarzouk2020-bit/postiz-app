import { Injectable, Logger } from '@nestjs/common';
import { ChannelCredentialsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/channel-credentials.repository';
import { SalesChannel } from '@prisma/client';

export interface ChannelSendResult {
  success: boolean;
  error?: string;
}

const GRAPH_API_VERSION = 'v20.0';

/**
 * Delivers an AI (or human-approved) reply out through the real channel the
 * lead came in on. Channels without a live outbound API (website widget,
 * manual leads, email, etc.) are not sendable here - the reply just stays
 * visible in-app for a human to relay.
 */
@Injectable()
export class ChannelSenderService {
  private readonly logger = new Logger(ChannelSenderService.name);

  constructor(private _credentialsRepository: ChannelCredentialsRepository) {}

  async send(
    organizationId: string,
    channel: SalesChannel,
    lead: { phone?: string | null; externalContactId?: string | null },
    content: string
  ): Promise<ChannelSendResult> {
    try {
      switch (channel) {
        case 'WHATSAPP':
          return await this.sendWhatsapp(organizationId, lead.phone, content);
        case 'FACEBOOK_MESSENGER':
        case 'INSTAGRAM':
          return await this.sendMeta(organizationId, lead.externalContactId, content);
        case 'TELEGRAM':
          return await this.sendTelegram(organizationId, lead.externalContactId, content);
        default:
          return {
            success: false,
            error: `Channel ${channel} has no live outbound connector - reply stays in-app only`,
          };
      }
    } catch (error) {
      this.logger.error(`Failed to send via ${channel}: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  private async sendWhatsapp(
    organizationId: string,
    phone: string | null | undefined,
    content: string
  ): Promise<ChannelSendResult> {
    if (!phone) {
      return { success: false, error: 'Lead has no phone number on file' };
    }
    const creds = await this._credentialsRepository.getMeta(organizationId);
    if (!creds?.whatsappAccessToken || !creds?.whatsappPhoneNumberId) {
      return { success: false, error: 'WhatsApp is not connected for this organization' };
    }

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${creds.whatsappPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace(/[^\d+]/g, ''),
          type: 'text',
          text: { body: content },
        }),
      }
    );

    if (!response.ok) {
      return { success: false, error: `WhatsApp API error: ${await response.text()}` };
    }
    return { success: true };
  }

  private async sendMeta(
    organizationId: string,
    externalContactId: string | null | undefined,
    content: string
  ): Promise<ChannelSendResult> {
    if (!externalContactId) {
      return { success: false, error: 'Lead has no Messenger/Instagram contact id on file' };
    }
    const creds = await this._credentialsRepository.getMeta(organizationId);
    if (!creds?.pageAccessToken) {
      return { success: false, error: 'Messenger/Instagram is not connected for this organization' };
    }

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${encodeURIComponent(
        creds.pageAccessToken
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: externalContactId },
          message: { text: content },
        }),
      }
    );

    if (!response.ok) {
      return { success: false, error: `Meta Send API error: ${await response.text()}` };
    }
    return { success: true };
  }

  private async sendTelegram(
    organizationId: string,
    externalContactId: string | null | undefined,
    content: string
  ): Promise<ChannelSendResult> {
    if (!externalContactId) {
      return { success: false, error: 'Lead has no Telegram chat id on file' };
    }
    const creds = await this._credentialsRepository.getTelegram(organizationId);
    if (!creds?.botToken) {
      return { success: false, error: 'Telegram is not connected for this organization' };
    }

    const response = await fetch(
      `https://api.telegram.org/bot${creds.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: externalContactId, text: content }),
      }
    );

    if (!response.ok) {
      return { success: false, error: `Telegram API error: ${await response.text()}` };
    }
    return { success: true };
  }
}
