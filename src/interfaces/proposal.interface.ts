import { ProposalDocument } from 'src/schemas/proposal.schema';

export type ProposalWhere = {
  _id?: string;
  projectId?: string;
  freelancerId?: string;
};

export interface IProposalRepository {
  create(data: Partial<ProposalDocument>): Promise<ProposalDocument>;

  findByPk(proposalId: string): Promise<ProposalDocument | null>;

  findOne(where: Partial<ProposalDocument>): Promise<ProposalDocument | null>;

  findAll(
    projectId: string,
    page?: number,
    limit?: number,
  ): Promise<ProposalDocument[]>;

  count(projectId: string): Promise<number>;

  update(
    data: Partial<ProposalDocument>,
    where: Partial<ProposalDocument>,
  ): Promise<void>;

  destroy(where: Partial<ProposalWhere>): Promise<void>;

  deleteAll(where?: any): Promise<void>;
}
