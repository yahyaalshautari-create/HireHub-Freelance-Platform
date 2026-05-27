import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateProposalDto } from 'src/dtos/proposal/create-proposal.dto';
import type { IProjectRepository } from 'src/interfaces/project.interface';
import type { IProposalRepository } from 'src/interfaces/proposal.interface';
import type { IFreelancerRepository } from 'src/interfaces/freelancer.interface';
import type { IClientRepository } from 'src/interfaces/client.interface';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import { messages } from 'src/libs/messages';
import { response } from 'src/libs/helpers';
import { ProposalStatus } from 'src/enums/proposal.enum';
import { UserRole } from 'src/enums/user.enum';
import { NotificationService } from './notification.service';
import { NotificationType } from 'src/enums/notification.enum';
import { RedisHelper } from 'src/redis/redis.helper';

@Injectable()
export class ProposalService {
  constructor(
    @Inject('IProposalRepository')
    private readonly proposalRepository: IProposalRepository,

    @Inject('IFreelancerRepository')
    private readonly freelancerRepository: IFreelancerRepository,

    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,

    @Inject('IProjectRepository')
    private readonly projectRepository: IProjectRepository,

    private readonly notificationService: NotificationService,
    private readonly redisHelper: RedisHelper,
  ) {}

  async createProposal(
    authUser: AuthUser,
    projectId: string,
    data: CreateProposalDto,
  ) {
    const redisKey = `proposal:exists:${projectId}:${authUser._id}`;

    const cached = await this.redisHelper.get(redisKey);
    if (cached === '1') {
      throw new BadRequestException(messages.proposal.alreadyExists);
    }

    const project = await this.projectRepository.findByPk(projectId);

    if (!project) {
      throw new NotFoundException(messages.project.notFound);
    }

    const existingProposal = await this.proposalRepository.findOne({
      projectId,
      freelancerId: authUser._id,
    });

    if (existingProposal) {
      await this.redisHelper.set(redisKey, '1', 3600);
      throw new BadRequestException(messages.proposal.alreadyExists);
    }

    const proposal = await this.proposalRepository.create({
      projectId,
      freelancerId: authUser._id,
      coverLetter: data.coverLetter,
      price: data.price,
      durationDays: data.durationDays,
      status: ProposalStatus.PENDING,
    });

    await this.redisHelper.set(redisKey, '1');

    await this.redisHelper.del(`project:proposals:${projectId}`);

    await this.freelancerRepository.update(
      { freelancerId: authUser._id },
      { $inc: { pendingProposals: 1 } },
    );

    await this.clientRepository.update(
      { clientId: project.clientId },
      { $inc: { pendingProposals: 1 } },
    );

    await this.notificationService.createNotification({
      receiverId: project.clientId,
      senderId: authUser._id,
      type: NotificationType.PROPOSAL,
      targetId: proposal._id.toString(),
      isRead: false,
    });

    return response(proposal, messages.proposal.create.success);
  }

  async getProposalsByProject(projectId: string, page = 1, limit = 10) {
    const project = await this.projectRepository.findByPk(projectId);

    if (!project) {
      throw new NotFoundException(messages.project.notFound);
    }

    const redisKey = `proposals:project:${projectId}:page:${page}:limit:${limit}`;

    const cached = await this.redisHelper.get(redisKey);

    if (cached) {
      return response(JSON.parse(cached), null);
    }

    const [proposals, total] = await Promise.all([
      this.proposalRepository.findAll(projectId, page, limit),
      this.proposalRepository.count(projectId),
    ]);

    const hasMore = page * limit < total;

    const result = {
      proposals,
      total,
      hasMore,
    };

    await this.redisHelper.set(redisKey, JSON.stringify(result), 60);

    return response(result, null);
  }

  async deleteProposal(authUser: AuthUser, proposalId: string) {
    if (authUser.role !== UserRole.ADMIN) {
      throw new BadRequestException(messages.proposal.delete.forbidden);
    }

    const proposal = await this.proposalRepository.findByPk(proposalId);

    if (!proposal) {
      throw new NotFoundException(messages.proposal.notFound);
    }

    await this.proposalRepository.destroy({
      _id: proposalId,
    });

    const redis = this.redisHelper;

    const projectId = proposal.projectId.toString();

    await redis.del(`proposals:project:${projectId}:page:1:limit:10`);
    await redis.del(`proposals:project:${projectId}:page:2:limit:10`);
    await redis.del(`proposals:project:${projectId}:page:3:limit:10`);

    await redis.del(`project:proposals:count:${projectId}`);

    return response(null, messages.proposal.delete.success);
  }
}
