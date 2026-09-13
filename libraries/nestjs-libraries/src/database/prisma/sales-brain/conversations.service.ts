import { Injectable, NotFoundException } from '@nestjs/common';
import { SalesConversationsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/conversations.repository';

@Injectable()
export class SalesConversationsService {
  constructor(private _conversationsRepository: SalesConversationsRepository) {}

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
    return this._conversationsRepository.setMessageDraftState(messageId, false);
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

  async sendHumanMessage(organizationId: string, conversationId: string, content: string) {
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
      content
    );
  }
}
