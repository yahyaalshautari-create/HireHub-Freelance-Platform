import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IProjectRepository } from 'src/interfaces/project.interface';

import { CreateProjectDto } from 'src/dtos/project/create-project.dto';

import { Project, ProjectDocument } from 'src/schemas/project.schema';
import { ProjectStatus } from 'src/enums/project.enum';

@Injectable()
export class ProjectRepository implements IProjectRepository {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(
    clientId: string,
    data: CreateProjectDto & {
      status: ProjectStatus;
    },
  ): Promise<ProjectDocument> {
    const project = await this.projectModel.create({
      clientId,
      ...data,
    });

    return project.toObject();
  }

  async findByPk(projectId: string): Promise<ProjectDocument | null> {
    return this.projectModel.findById(projectId).lean().exec();
  }

  async findAll(page = 1, limit = 10): Promise<ProjectDocument[]> {
    const skip = (page - 1) * limit;

    return this.projectModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async count(): Promise<number> {
    return this.projectModel.countDocuments();
  }

  async findByClientId(clientId: string): Promise<ProjectDocument[]> {
    return this.projectModel
      .find({ clientId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async update(
    projectId: string,
    data: Partial<ProjectDocument>,
  ): Promise<ProjectDocument | null> {
    return this.projectModel
      .findByIdAndUpdate(projectId, { $set: data }, { new: true })
      .lean()
      .exec();
  }

  async destroy(projectId: string): Promise<void> {
    await this.projectModel.deleteOne({ _id: projectId }).exec();
  }

  async deleteAll(where: any = {}): Promise<void> {
  await this.projectModel.deleteMany(where).exec();
}
}
