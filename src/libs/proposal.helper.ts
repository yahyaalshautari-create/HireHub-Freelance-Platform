import { Inject, Injectable } from '@nestjs/common';
import { ProposalStatus } from 'src/enums/proposal.enum';
import { ProjectStatus } from 'src/enums/project.enum';
import type { IProposalOptionRepository } from 'src/interfaces/proposal-option.interface';
import type { IProjectRepository } from 'src/interfaces/project.interface';
import type { IFreelancerRepository } from 'src/interfaces/freelancer.interface';
import type { IClientRepository } from 'src/interfaces/client.interface';
import { ProposalDocument } from 'src/schemas/proposal.schema';
import { ProjectDocument } from 'src/schemas/project.schema';

@Injectable()
export class ProposalHelper {
  constructor(
    @Inject('IProposalOptionRepository')
    private readonly proposalRepository: IProposalOptionRepository,

    @Inject('IProjectRepository')
    private readonly projectRepository: IProjectRepository,

    @Inject('IFreelancerRepository')
    private readonly freelancerRepository: IFreelancerRepository,

    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  async acceptProposalFlow(
    proposal: ProposalDocument,
    project: ProjectDocument,
  ) {
    const otherProposals = await this.proposalRepository.findAll([
      proposal.projectId,
    ]);

    const filtered = otherProposals.filter(
      (p) => p._id.toString() !== proposal._id.toString(),
    );

    const freelancerIds = filtered.map((p) => p.freelancerId);

    await Promise.all([
      this.projectRepository.update(project._id.toString(), {
        status: ProjectStatus.IN_PROGRESS,
      }),

      filtered.length > 0
        ? this.proposalRepository.update(
            { status: ProposalStatus.REJECTED },
            {
              _id: { $in: filtered.map((p) => p._id) } as any,
            },
          )
        : Promise.resolve(),

      freelancerIds.length > 0
        ? this.freelancerRepository.update(
            { freelancerId: { $in: freelancerIds } as any },
            {
              $inc: {
                pendingProposal: -1,
                rejectedProposal: 1,
              },
            },
          )
        : Promise.resolve(),

      this.freelancerRepository.update(
        { freelancerId: proposal.freelancerId },
        {
          $inc: {
            pendingProposal: -1,
            underImplementationProject: 1,
          },
        },
      ),

      this.clientRepository.update(
        { clientId: project.clientId },
        {
          $inc: {
            pendingProposals: -1,
          },
        },
      ),
    ]);
  }
}
