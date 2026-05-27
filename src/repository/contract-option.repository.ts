import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  ContractOptionWhere,
  IContractOptionRepository,
} from 'src/interfaces/contract-option.interface';

import { Contract, ContractDocument } from 'src/schemas/contract.schema';

import { ReviewContractStatus } from 'src/enums/contract.enum';

export class ContractOptionRepository implements IContractOptionRepository {
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
  ) {}

  async findByPk(contractId: string): Promise<ContractDocument | null> {
    return this.contractModel.findById(contractId).exec();
  }

  async update(
    data: Partial<ContractDocument>,
    where: Partial<ContractOptionWhere>,
  ): Promise<void> {
    await this.contractModel.updateMany(where, data);
  }

  async findPendingRequests(page = 1, limit = 10): Promise<ContractDocument[]> {
    const skip = (page - 1) * limit;

    return this.contractModel
      .find({
        cancelRequested: true,
        reviewContractStatus: ReviewContractStatus.PENDING,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  async countPendingRequests(): Promise<number> {
    return this.contractModel.countDocuments({
      cancelRequested: true,
      reviewContractStatus: ReviewContractStatus.PENDING,
    });
  }
}
