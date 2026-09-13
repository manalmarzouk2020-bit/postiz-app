import { Injectable } from '@nestjs/common';
import { SalesConversationsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/conversations.repository';

@Injectable()
export class SalesConversationsService {
  constructor(private _conversationsRepository: SalesConversationsRepository) {}

  getConversation(organizationId: string, id: string) {
    return this._conversationsRepository.getConversation(organizationId, id);
  }
}
