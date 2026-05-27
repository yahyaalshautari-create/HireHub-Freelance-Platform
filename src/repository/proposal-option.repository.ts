import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProposalOptionRepository } from 'src/interfaces/proposal-option.interface';
import { ProposalWhere } from 'src/interfaces/proposal.interface';
import { Proposal, ProposalDocument } from 'src/schemas/proposal.schema';

export class ProposalOptionRepository implements IProposalOptionRepository {
  constructor(
    @InjectModel(Proposal.name)
    private readonly proposalModel: Model<ProposalDocument>,
  ) {}

  async findByPk(proposalId: string): Promise<ProposalDocument | null> {
    return this.proposalModel.findById(proposalId).exec();
  }

  async findAll(projectIds: string[]): Promise<ProposalDocument[]> {
    return this.proposalModel
      .find({
        projectId: { $in: projectIds },
        isUpdatePending: true,
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async update(
    data: Partial<ProposalDocument>,
    where: Partial<ProposalWhere>,
  ): Promise<void> {
    await this.proposalModel.updateMany(where, data);
  }
}
