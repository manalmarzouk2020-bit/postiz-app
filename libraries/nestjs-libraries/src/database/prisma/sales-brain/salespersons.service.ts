import { Injectable, NotFoundException } from '@nestjs/common';
import { SalespersonsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/salespersons.repository';
import { CreateSalespersonDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/salesperson.dto';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalespersonsService {
  constructor(
    private _salespersonsRepository: SalespersonsRepository,
    private _openaiService: OpenaiService
  ) {}

  getSalespersons(organizationId: string) {
    return this._salespersonsRepository.getSalespersons(organizationId);
  }

  create(organizationId: string, body: CreateSalespersonDto) {
    return this._salespersonsRepository.create(organizationId, body);
  }

  async generateCoachingReport(organizationId: string, salespersonId: string) {
    const salesperson = await this._salespersonsRepository.getSalesperson(
      organizationId,
      salespersonId
    );
    if (!salesperson) {
      throw new NotFoundException('Salesperson not found');
    }

    const transcripts = await this._salespersonsRepository.getTranscriptsForSalesperson(
      organizationId,
      salespersonId
    );
    if (!transcripts.length) {
      throw new NotFoundException(
        'This salesperson has no recorded conversations yet - send at least one message as them first'
      );
    }

    const report = await this._openaiService.generateCoachingReport(
      salesperson.name,
      transcripts
    );

    return this._salespersonsRepository.upsertCoachingReport(
      organizationId,
      salespersonId,
      report as Prisma.InputJsonValue
    );
  }

  getLatestCoachingReport(organizationId: string, salespersonId: string) {
    return this._salespersonsRepository.getLatestCoachingReport(
      organizationId,
      salespersonId
    );
  }
}
