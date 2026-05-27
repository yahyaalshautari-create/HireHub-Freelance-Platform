import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { ContractDocument, Contract } from 'src/schemas/contract.schema';

import {
  IContractRepository,
  ContractWhere,
} from 'src/interfaces/contract.interface';

export class ContractRepository implements IContractRepository {
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
  ) {}

  async create(data: Partial<ContractDocument>): Promise<ContractDocument> {
    return this.contractModel.create(data);
  }

  async findByPk(contractId: string): Promise<ContractDocument | null> {
    return this.contractModel.findById(contractId).exec();
  }

  async findOne(
    where: Partial<ContractWhere>,
  ): Promise<ContractDocument | null> {
    return this.contractModel.findOne(where).exec();
  }

  async findAll(page = 1, limit = 10): Promise<ContractDocument[]> {
    const skip = (page - 1) * limit;

    return this.contractModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  async count(): Promise<number> {
    return this.contractModel.countDocuments();
  }

  async update(
    where: Partial<ContractWhere>,
    data: UpdateQuery<ContractDocument>,
  ): Promise<void> {
    await this.contractModel.updateMany(where, data);
  }

  async destroy(where: Partial<ContractWhere>): Promise<void> {
    await this.contractModel.deleteMany(where);
  }

  async deleteAll(where: any = {}): Promise<void> {
  await this.contractModel.deleteMany(where).exec();
}
}
