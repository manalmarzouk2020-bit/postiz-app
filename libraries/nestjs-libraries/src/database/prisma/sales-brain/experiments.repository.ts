import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateExperimentDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/experiment.dto';

@Injectable()
export class SalesExperimentsRepository {
  constructor(
    private _experiment: PrismaRepository<'salesExperiment'>,
    private _assignment: PrismaRepository<'salesExperimentAssignment'>
  ) {}

  getExperiments(organizationId: string) {
    return this._experiment.model.salesExperiment.findMany({
      where: { organizationId },
      include: { _count: { select: { assignments: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  getActiveExperiment(organizationId: string) {
    return this._experiment.model.salesExperiment.findFirst({
      where: { organizationId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(organizationId: string, body: CreateExperimentDto) {
    return this._experiment.model.salesExperiment.create({
      data: { organizationId, ...body },
    });
  }

  complete(organizationId: string, id: string) {
    return this._experiment.model.salesExperiment.updateMany({
      where: { id, organizationId },
      data: { status: 'COMPLETED' },
    });
  }

  createAssignment(experimentId: string, leadId: string, variant: string) {
    return this._assignment.model.salesExperimentAssignment.create({
      data: { experimentId, leadId, variant },
    });
  }

  getAssignmentForLead(leadId: string) {
    return this._assignment.model.salesExperimentAssignment.findFirst({
      where: { leadId, converted: false },
      include: { experiment: true },
      orderBy: { assignedAt: 'desc' },
    });
  }

  markConverted(id: string) {
    return this._assignment.model.salesExperimentAssignment.update({
      where: { id },
      data: { converted: true },
    });
  }

  getResults(organizationId: string, experimentId: string) {
    return this._assignment.model.salesExperimentAssignment.findMany({
      where: { experimentId, experiment: { organizationId } },
    });
  }
}
