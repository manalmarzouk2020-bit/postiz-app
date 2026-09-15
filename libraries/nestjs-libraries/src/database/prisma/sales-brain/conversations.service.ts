import { Injectable, NotFoundException } from '@nestjs/common';
import { SalesConversationsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/conversations.repository';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';
import { ChannelSenderService } from '@gitroom/nestjs-libraries/sales-brain/channel-sender.service';

@Injectable()
export class SalesConversationsService {
  constructor(
    private _conversationsRepository: SalesConversationsRepository,
    private _openaiService: OpenaiService,
    private _channelSenderService: ChannelSenderService
  ) {}

  getConversation(organizationId: string, id: string) {
    return this._conversationsRepository.getConversation(organizationId, id);
  }

  getHandoffs(organizationId: string) {
    return this._conversationsRepository.getHandoffs(organizationId);
  }

  resolveHandoff(organizationId: string, id: string) {
    return this._conversationsRepository.setHandoff(organizationId, id, false, null);
  }

  async approveDraft(organizationId: string, messageId: string) {
    const draft = await this._conversationsRepository.getDraftMessage(
      organizationId,
      messageId
    );
    if (!draft) {
      throw new NotFoundException('Draft message not found');
    }

    const updated = await this._conversationsRepository.setMessageDraftState(
      messageId,
      false
    );

    const lead = draft.conversation?.lead;
    if (lead) {
      const sendResult = await this._channelSenderService.send(
        organizationId,
        lead.source,
        { phone: lead.phone, externalContactId: lead.externalContactId },
        draft.content
      );
      await this._conversationsRepository.setDeliveryResult(
        messageId,
        sendResult.success,
        sendResult.error
      );
    }

    return updated;
  }

  async rejectDraft(organizationId: string, messageId: string) {
    const draft = await this._conversationsRepository.getDraftMessage(
      organizationId,
      messageId
    );
    if (!draft) {
      throw new NotFoundException('Draft message not found');
    }
    return this._conversationsRepository.deleteMessage(messageId);
  }

  async sendHumanMessage(
    organizationId: string,
    conversationId: string,
    content: string,
    salespersonId?: string
  ) {
    const conversation = await this._conversationsRepository.getConversation(
      organizationId,
      conversationId
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return this._conversationsRepository.addMessage(
      conversationId,
      'HUMAN',
      content,
      undefined,
      false,
      salespersonId
    );
  }

  async analyzeConversation(organizationId: string, conversationId: string) {
    const conversation = await this._conversationsRepository.getConversation(
      organizationId,
      conversationId
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (!conversation.messages.length) {
      throw new NotFoundException('Conversation has no messages to analyze yet');
    }

    const analysis = await this._openaiService.analyzeConversation(
      conversation.messages.map((m) => ({ role: m.role, content: m.content }))
    );

    return this._conversationsRepository.upsertAnalysis(organizationId, conversationId, {
      discovery: analysis.discovery,
      personalization: analysis.personalization,
      relevance: analysis.relevance,
      empathy: analysis.empathy,
      valueCommunication: analysis.valueCommunication,
      objectionHandling: analysis.objectionHandling,
      closing: analysis.closing,
      followUp: analysis.followUp,
      accuracy: analysis.accuracy,
      score: analysis.overallScore,
      whyBought: analysis.whyBought,
      whyNotBought: analysis.whyNotBought,
    });
  }
}
