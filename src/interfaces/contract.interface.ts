import { UpdateQuery } from 'mongoose';
import { ContractDocument } from 'src/schemas/contract.schema';

export type ContractWhere = {
  _id?: string;
  projectId?: string;
  proposalId?: string;
  clientId?: string;
  freelancerId?: string;
};

export interface IContractRepository {
  create(data: Partial<ContractDocument>): Promise<ContractDocument>;

  findByPk(contractId: string): Promise<ContractDocument | null>;

  findOne(where: Partial<ContractWhere>): Promise<ContractDocument | null>;

  findAll(page?: number, limit?: number): Promise<ContractDocument[]>;

  count(): Promise<number>;

  update(
    where: Partial<ContractWhere>,
    data: UpdateQuery<ContractDocument>,
  ): Promise<void>;

  destroy(where: Partial<ContractWhere>): Promise<void>;

  deleteAll(where?: any): Promise<void>;
}
