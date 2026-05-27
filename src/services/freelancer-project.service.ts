import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateFreelancerProjectDto } from 'src/dtos/freelancer-project/create-freelancer-project.dto';
import { UpdateFreelancerProjectDto } from 'src/dtos/freelancer-project/update-freelancer-project.dto';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import type { IFreelancerProjectRepository } from 'src/interfaces/freelancer-project.interface';
import { uploadToCloudinary } from 'src/libs/cloudinary';
import { assertOwnerOrAdmin, response } from 'src/libs/helpers';
import { messages } from 'src/libs/messages';

@Injectable()
export class FreelancerProjectService {
  constructor(
    @Inject('IFreelancerProjectRepository')
    private readonly freelancerProjectRepository: IFreelancerProjectRepository,
  ) {}

  async crearteFreelancerProject(
    authUser: AuthUser,
    data: CreateFreelancerProjectDto,
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(messages.freelancerProject.imageRequired);
    }

    const images = await Promise.all(
      files.map((file) => uploadToCloudinary(file, 'freelancer-projects')),
    );

    const projectsCount = await this.freelancerProjectRepository.count(
      authUser._id,
    );

    if (projectsCount >= 5) {
      throw new BadRequestException(messages.freelancerProject.projectLimit);
    }

    const project = await this.freelancerProjectRepository.create(
      authUser._id,
      {
        ...data,
        images: images.map((img) => img.secure_url),
      },
    );

    return response(project, messages.freelancerProject.success);
  }

  async getFreelancerProjects(freelancerId: string) {
    const projects =
      await this.freelancerProjectRepository.findAll(freelancerId);

    return response(projects, null);
  }

  async getMyProjects(freelancerId: string) {
    const projects =
      await this.freelancerProjectRepository.findAll(freelancerId);

    return response(projects, null);
  }

  async updateFreelancerProject(
    authUser: AuthUser,
    projectId: string,
    data: UpdateFreelancerProjectDto,
    files: Express.Multer.File[],
  ) {
    const project = await this.freelancerProjectRepository.findByPk(projectId);

    if (!project) {
      throw new BadRequestException(messages.freelancerProject.notFound);
    }

    assertOwnerOrAdmin({
      ownerId: project.freelancerId,
      authUser,
      message: messages.freelancerProject.forbidden,
    });

    let images: string[] = project.images || [];

    if (files && files.length > 0) {
      const uploadedImages = await Promise.all(
        files.map((file) => uploadToCloudinary(file, 'freelancer-projects')),
      );

      images = uploadedImages.map((img) => img.secure_url);
    }

    const updatedProject = await this.freelancerProjectRepository.update(
      projectId,
      {
        title: data.title ?? project.title,
        description: data.description ?? project.description,
        linkDemo: data.linkDemo ?? project.linkDemo,
        images,
      },
    );

    return response(updatedProject, messages.freelancerProject.success);
  }

  async deleteFreelancerProject(authUser: AuthUser, projectId: string) {
    const project = await this.freelancerProjectRepository.findByPk(projectId);

    if (!project) {
      throw new BadRequestException(messages.freelancerProject.notFound);
    }

    assertOwnerOrAdmin({
      ownerId: project.freelancerId,
      authUser,
      message: messages.freelancerProject.forbidden,
    });

    await this.freelancerProjectRepository.destroy(projectId);

    return response(null, messages.freelancerProject.success);
  }
}
