import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from 'src/dtos/project/create-project.dto';
import { ProjectStatus } from 'src/enums/project.enum';
import { UserRole } from 'src/enums/user.enum';
import { response, assertOwnerOrAdmin } from 'src/libs/helpers';
import { messages } from 'src/libs/messages';
import type { IUserRepository } from 'src/interfaces/user.interface';
import type { IProjectRepository } from 'src/interfaces/project.interface';
import type { IProposalRepository } from 'src/interfaces/proposal.interface';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import { RedisHelper } from 'src/redis/redis.helper';

@Injectable()
export class ProjectService {
  constructor(
    @Inject('IProjectRepository')
    private readonly projectRepository: IProjectRepository,

    @Inject('IProposalRepository')
    private readonly proposalRepository: IProposalRepository,

    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly redisHelper: RedisHelper,
  ) {}
  async createProject(clientId: string, data: CreateProjectDto) {
    const project = await this.projectRepository.create(clientId, {
      title: data.title,
      description: data.description,
      budget: data.budget,
      budgetType: data.budgetType,
      status: ProjectStatus.PENDING_REVIEW,
    });

    const redis = this.redisHelper;

    await redis.del(`projects:client:${clientId}`);
    await redis.del(`projects:public:feed`);

    return response(project, messages.project.create.success);
  }
  async reviewProject(
    adminId: string,
    projectId: string,
    status: ProjectStatus.OPEN | ProjectStatus.REJECTED,
  ) {
    const admin = await this.userRepository.findByPk(adminId);

    if (
      !admin ||
      (admin.role !== UserRole.ADMIN && admin.role !== UserRole.SUPPORT)
    ) {
      throw new ForbiddenException(messages.user.updateRole.unauthorized);
    }

    const project = await this.projectRepository.findByPk(projectId);

    if (!project) {
      throw new NotFoundException(messages.project.notFound);
    }

    if (project.status !== ProjectStatus.PENDING_REVIEW) {
      throw new ForbiddenException(messages.project.review.invalidStatus);
    }

    const updatedProject = await this.projectRepository.update(projectId, {
      status,
    });

    const redis = this.redisHelper;

    await redis.del(`project:${projectId}`);
    await redis.del(`projects:client:${project.clientId}`);
    await redis.del(`projects:public:feed`);

    return response(updatedProject, messages.project.review.success);
  }

  async getAllProjects(page = 1, limit = 10) {
    const redis = this.redisHelper;

    const cacheKey = `projects:all:page:${page}:limit:${limit}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return response(JSON.parse(cached), null);
    }

    const [projects, total] = await Promise.all([
      this.projectRepository.findAll(page, limit),
      this.projectRepository.count(),
    ]);

    const result = {
      projects,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };

    await redis.set(cacheKey, JSON.stringify(result), 60);

    return response(result, null);
  }
  async getProjectById(projectId: string) {
    const redis = this.redisHelper;

    const cacheKey = `project:${projectId}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return response(JSON.parse(cached), null);
    }

    const project = await this.projectRepository.findByPk(projectId);

    if (!project) {
      throw new NotFoundException(messages.project.notFound);
    }

    await redis.set(cacheKey, JSON.stringify(project), 300);

    return response(project, null);
  }
  async getProjectByClient(clientId: string) {
    const redis = this.redisHelper;

    const cacheKey = `projects:client:${clientId}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return response(JSON.parse(cached), null);
    }

    const projects = await this.projectRepository.findByClientId(clientId);

    await redis.set(cacheKey, JSON.stringify(projects), 60);

    return response(projects, null);
  }

  async deleteProject(authUser: AuthUser, projectId: string) {
    const project = await this.projectRepository.findByPk(projectId);

    if (!project) {
      throw new NotFoundException(messages.project.notFound);
    }

    assertOwnerOrAdmin({
      ownerId: project.clientId,
      authUser,
      message: messages.project.delete.forbidden,
    });

    await this.proposalRepository.deleteAll({ projectId });

    await this.projectRepository.destroy(projectId);

    const redis = this.redisHelper;

    await redis.del(`project:${projectId}`);
    await redis.del(`projects:client:${project.clientId}`);
    await redis.del(`projects:public:feed`);

    return response(null, messages.project.delete.success);
  }
}
