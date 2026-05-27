import { UpdateQuery } from 'mongoose';
import { UpdateFreelancerDto } from 'src/dtos/freelancer/update-freelancer.dto';
import { Freelancer } from 'src/schemas/freelancer.schema';

export interface IFreelancerRepository {
  findOne(filter: Partial<Freelancer>): Promise<Freelancer | null>;

  update(
    filter: Partial<Freelancer>,
    data: UpdateQuery<UpdateFreelancerDto>,
  ): Promise<Freelancer | null>;

  deleteAll(where?: any): Promise<void>;
}
