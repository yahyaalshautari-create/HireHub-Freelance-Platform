import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { IFreelancerRepository } from 'src/interfaces/freelancer.interface';
import { Freelancer, FreelancerDocument } from 'src/schemas/freelancer.schema';
import { UpdateFreelancerDto } from 'src/dtos/freelancer/update-freelancer.dto';

@Injectable()
export class FreelancerRepository implements IFreelancerRepository {
  constructor(
    @InjectModel(Freelancer.name)
    private readonly freelancerModel: Model<FreelancerDocument>,
  ) {}

  async findOne(filter: Partial<Freelancer>): Promise<Freelancer | null> {
    return this.freelancerModel.findOne(filter).exec();
  }

  async update(
    filter: Partial<Freelancer>,
    data: UpdateQuery<UpdateFreelancerDto>,
  ): Promise<Freelancer | null> {
    return this.freelancerModel.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true },
    );
  }

  async deleteAll(where: any = {}): Promise<void> {
  await this.freelancerModel.deleteMany(where).exec();
}
}
