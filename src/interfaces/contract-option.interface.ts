import { ContractDocument } from 'src/schemas/contract.schema';
import { ReviewContractStatus } from 'src/enums/contract.enum';

export type ContractOptionWhere = {
  _id?: string;
  clientId?: string;
  freelancerId?: string;
  proposalId?: string;

  cancelRequested?: boolean;

  reviewContractStatus?: ReviewContractStatus;
};

export interface IContractOptionRepository {
  findByPk(contractId: string): Promise<ContractDocument | null>;

  update(
    data: Partial<ContractDocument>,
    where: Partial<ContractOptionWhere>,
  ): Promise<void>;

  findPendingRequests(
    page?: number,
    limit?: number,
  ): Promise<ContractDocument[]>;

  countPendingRequests(): Promise<number>;
}
