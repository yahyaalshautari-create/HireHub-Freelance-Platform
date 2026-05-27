import { UpdateQuery } from 'mongoose';
import { CreateFreelancerProjectDto } from 'src/dtos/freelancer-project/create-freelancer-project.dto';
import { UpdateFreelancerProjectDto } from 'src/dtos/freelancer-project/update-freelancer-project.dto';
import { FreelancerProjectDocument } from 'src/schemas/freelancer-project.schema';

export interface IFreelancerProjectRepository {
  count(freelancerId: string): Promise<number>;

  create(
    freelancerId: string,
    data: CreateFreelancerProjectDto & { images: string[] },
  ): Promise<FreelancerProjectDocument>;

  findAll(freelancerId: string): Promise<FreelancerProjectDocument[]>;

  findByPk(projectId: string): Promise<FreelancerProjectDocument | null>;

  update(
    projectId: string,
    data: UpdateQuery<UpdateFreelancerProjectDto> & { images?: string[] },
  ): Promise<FreelancerProjectDocument | null>;

  destroy(projectId: string): Promise<void>;

  deleteAll(where?: any): Promise<void>;
}
