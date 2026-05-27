import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IFreelancerProjectRepository } from 'src/interfaces/freelancer-project.interface';
import {
  FreelancerProject,
  FreelancerProjectDocument,
} from 'src/schemas/freelancer-project.schema';
import { CreateFreelancerProjectDto } from 'src/dtos/freelancer-project/create-freelancer-project.dto';
import { UpdateFreelancerProjectDto } from 'src/dtos/freelancer-project/update-freelancer-project.dto';

@Injectable()
export class FreelancerProjectRepository implements IFreelancerProjectRepository {
  constructor(
    @InjectModel(FreelancerProject.name)
    private readonly freelancerProjectModel: Model<FreelancerProjectDocument>,
  ) {}

  async count(freelancerId: string): Promise<number> {
    return this.freelancerProjectModel.countDocuments({ freelancerId });
  }

  async create(
    freelancerId: string,
    data: CreateFreelancerProjectDto & { images: string[] },
  ): Promise<FreelancerProjectDocument> {
    const project = await this.freelancerProjectModel.create({
      freelancerId,
      ...data,
    });

    return project.toObject();
  }

  async findAll(freelancerId: string): Promise<FreelancerProjectDocument[]> {
    return this.freelancerProjectModel
      .find({ freelancerId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findByPk(projectId: string): Promise<FreelancerProjectDocument | null> {
    return this.freelancerProjectModel.findById(projectId).lean().exec();
  }

  async update(
    projectId: string,
    data: Partial<UpdateFreelancerProjectDto> & { images?: string[] },
  ): Promise<FreelancerProjectDocument | null> {
    return this.freelancerProjectModel
      .findByIdAndUpdate(projectId, { $set: data }, { new: true })
      .lean()
      .exec();
  }

  async destroy(projectId: string): Promise<void> {
    await this.freelancerProjectModel.deleteOne({ _id: projectId }).exec();
  }

  async deleteAll(where: any = {}): Promise<void> {
    await this.freelancerProjectModel.deleteMany(where).exec();
  }
}
