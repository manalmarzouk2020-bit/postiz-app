import { Injectable } from '@nestjs/common';
import { SalesExperimentsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/experiments.repository';
import { CreateExperimentDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/experiment.dto';

@Injectable()
export class SalesExperimentsService {
  constructor(private _experimentsRepository: SalesExperimentsRepository) {}

  getExperiments(organizationId: string) {
    return this._experimentsRepository.getExperiments(organizationId);
  }

  create(organizationId: string, body: CreateExperimentDto) {
    return this._experimentsRepository.create(organizationId, body);
  }

  complete(organizationId: string, id: string) {
    return this._experimentsRepository.complete(organizationId, id);
  }

  async getResults(organizationId: string, experimentId: string) {
    const assignments = await this._experimentsRepository.getResults(
      organizationId,
      experimentId
    );
    const summarize = (variant: string) => {
      const forVariant = assignments.filter((a) => a.variant === variant);
      const converted = forVariant.filter((a) => a.converted).length;
      return {
        assigned: forVariant.length,
        converted,
        conversionRate: forVariant.length ? converted / forVariant.length : 0,
      };
    };
    return { variantA: summarize('A'), variantB: summarize('B') };
  }

  /**
   * Called on a lead's very first inbound message. Returns the opening-message
   * variant to send (overriding the AI's own draft) if an active experiment
   * exists, so the A/B test controls what the prospect actually sees.
   */
  async assignVariantForNewLead(organizationId: string, leadId: string) {
    const experiment = await this._experimentsRepository.getActiveExperiment(
      organizationId
    );
    if (!experiment) {
      return null;
    }

    const variant = Math.random() < 0.5 ? 'A' : 'B';
    await this._experimentsRepository.createAssignment(experiment.id, leadId, variant);

    return {
      experimentId: experiment.id,
      variant,
      content: variant === 'A' ? experiment.variantAContent : experiment.variantBContent,
    };
  }

  async markConversionIfAny(leadId: string) {
    const assignment = await this._experimentsRepository.getAssignmentForLead(leadId);
    if (assignment) {
      await this._experimentsRepository.markConverted(assignment.id);
    }
  }
}
