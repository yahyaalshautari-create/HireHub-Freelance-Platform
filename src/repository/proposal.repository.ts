import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProposalRepository, ProposalWhere } from 'src/interfaces/proposal.interface';
import { Proposal, ProposalDocument } from 'src/schemas/proposal.schema';

export class ProposalRepository implements IProposalRepository {
  constructor(
    @InjectModel(Proposal.name)
    private readonly proposalModel: Model<ProposalDocument>,
  ) {}

  async create(data: Partial<ProposalDocument>): Promise<ProposalDocument> {
    return this.proposalModel.create(data);
  }

  async findByPk(proposalId: string): Promise<ProposalDocument | null> {
    return this.proposalModel.findById(proposalId).exec();
  }

  async findOne(
    where: Partial<ProposalDocument>,
  ): Promise<ProposalDocument | null> {
    return this.proposalModel.findOne(where).exec();
  }

  async findAll(
    projectId: string,
    page = 1,
    limit = 10,
  ): Promise<ProposalDocument[]> {
    const skip = (page - 1) * limit;

    return this.proposalModel
      .find({ projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  async count(projectId: string): Promise<number> {
    return this.proposalModel.countDocuments({ projectId });
  }

  async update(
    data: Partial<ProposalDocument>,
    where: Partial<ProposalDocument>,
  ): Promise<void> {
    await this.proposalModel.updateMany(where, data);
  }

  async destroy(where: Partial<ProposalWhere>): Promise<void> {
    await this.proposalModel.deleteMany(where);
  }

  async deleteAll(where: any = {}): Promise<void> {
  await this.proposalModel.deleteMany(where).exec();
}
}
