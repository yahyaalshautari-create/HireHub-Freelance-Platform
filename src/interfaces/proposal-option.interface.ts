import { ProposalDocument } from 'src/schemas/proposal.schema';
import { ProposalWhere } from './proposal.interface';

export interface IProposalOptionRepository {
  findByPk(proposalId: string): Promise<ProposalDocument | null>;

  findAll(projectIds: string[]): Promise<ProposalDocument[]>;

  update(
    data: Partial<ProposalDocument>,
    where: Partial<ProposalWhere>,
  ): Promise<void>;
}
