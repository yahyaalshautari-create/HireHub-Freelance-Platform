import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateProposalDto } from 'src/dtos/proposal/create-proposal.dto';
import { ProposalStatus } from 'src/enums/proposal.enum';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import type { IProjectRepository } from 'src/interfaces/project.interface';
import type { IUserRepository } from 'src/interfaces/user.interface';
import type { IProposalOptionRepository } from 'src/interfaces/proposal-option.interface';
import { assertOwnerOrAdmin, response } from 'src/libs/helpers';
import { messages } from 'src/libs/messages';
import { ProposalHelper } from 'src/libs/proposal.helper';
import { NotificationType } from 'src/enums/notification.enum';
import { NotificationService } from './notification.service';
import { RedisHelper } from 'src/redis/redis.helper';

@Injectable()
export class ProposalOptionService {
  constructor(
    @Inject('IProposalOptionRepository')
    private readonly proposalOptionRepository: IProposalOptionRepository,

    @Inject('IProjectRepository')
    private readonly projectRepository: IProjectRepository,

    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly proposalHelper: ProposalHelper,
    private readonly notificationService: NotificationService,
    private readonly redisHelper: RedisHelper,
  ) {}

  async updateProposal(
    authUser: AuthUser,
    proposalId: string,
    data: CreateProposalDto,
  ) {
    const proposal = await this.proposalOptionRepository.findByPk(proposalId);

    if (!proposal) {
      throw new NotFoundException(messages.proposal.notFound);
    }

    assertOwnerOrAdmin({
      ownerId: proposal.freelancerId,
      authUser,
      message: messages.proposal.forbidden,
    });

    if (proposal.isUpdatePending) {
      throw new BadRequestException(messages.proposal.update.alreadyPending);
    }

    const project = await this.projectRepository.findByPk(proposal.projectId);

    if (!project) {
      throw new NotFoundException(messages.project.notFound);
    }

    await this.proposalOptionRepository.update(
      {
        pendingPrice: data.price,
        pendingDurationDays: data.durationDays,
        isUpdatePending: true,
      },
      {
        _id: proposalId,
      },
    );

    const redis = this.redisHelper;

    const projectId = proposal.projectId.toString();

    await redis.del(`proposals:project:${projectId}:version`);
    await redis.del(`proposal:${proposalId}`);
    await redis.del(`project:proposals:count:${projectId}`);

    return response(null, messages.proposal.update.success);
  }

  async getPendingProposalUpdates(authUser: AuthUser) {
    const redis = this.redisHelper;

    const cacheKey = `proposal:pending-updates:${authUser._id}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return response(JSON.parse(cached), null);
    }

    const projects = await this.projectRepository.findByClientId(authUser._id);

    const projectIds = projects.map((p) => p._id.toString());

    const proposals = await this.proposalOptionRepository.findAll(projectIds);

    await redis.set(cacheKey, JSON.stringify(proposals), 60);

    return response(proposals, null);
  }

  async approveProposal(authUser: AuthUser, proposalId: string) {
    const proposal = await this.proposalOptionRepository.findByPk(proposalId);

    if (!proposal) {
      throw new NotFoundException(messages.proposal.notFound);
    }

    const project = await this.projectRepository.findByPk(proposal.projectId);

    if (!project) {
      throw new NotFoundException(messages.project.notFound);
    }

    if (project.clientId !== authUser._id) {
      throw new ForbiddenException(messages.proposal.approve.forbidden);
    }

    const redis = this.redisHelper;
    const projectId = proposal.projectId.toString();

    if (proposal.isUpdatePending) {
      await this.proposalOptionRepository.update(
        {
          price: proposal.pendingPrice,
          durationDays: proposal.pendingDurationDays,

          pendingPrice: undefined,
          pendingDurationDays: undefined,

          isUpdatePending: false,
        },
        {
          _id: proposalId,
        },
      );
    }

    await redis.del(`proposal:${proposalId}`);
    await redis.del(`proposal:pending-updates:${authUser._id}`);
    await redis.del(`proposals:project:${projectId}:version`);
    await redis.del(`project:proposals:count:${projectId}`);

    await this.notificationService.createNotification({
      receiverId: proposal.freelancerId,
      senderId: authUser._id,
      type: NotificationType.APPROVED_PROPOSAL,
      targetId: proposal._id.toString(),
      isRead: false,
    });

    return response(null, messages.proposal.approve.success);
  }

  async updateProposalStatus(
    authUser: AuthUser,
    proposalId: string,
    status: ProposalStatus,
  ) {
    const proposal = await this.proposalOptionRepository.findByPk(proposalId);

    if (!proposal) {
      throw new NotFoundException(messages.proposal.notFound);
    }

    const project = await this.projectRepository.findByPk(proposal.projectId);

    if (!project) {
      throw new NotFoundException(messages.project.notFound);
    }

    assertOwnerOrAdmin({
      ownerId: project.clientId,
      authUser,
      message: messages.proposal.updateStatus.forbidden,
    });

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException(
        messages.proposal.updateStatus.invalidStatus,
      );
    }

    if (status === ProposalStatus.ACCEPTED) {
      const client = await this.userRepository.findByPk(project.clientId);

      if (!client) {
        throw new NotFoundException(messages.client.notFound);
      }

      if (client.balance < proposal.price) {
        throw new BadRequestException(
          messages.proposal.accept.insufficientFunds,
        );
      }

      await this.userRepository.update(
        {
          balance: client.balance - proposal.price,
          frozenBalance: (client.frozenBalance || 0) + proposal.price,
        },
        { _id: client._id },
      );

      await this.proposalHelper.acceptProposalFlow(proposal, project);
    }

    await this.proposalOptionRepository.update(
      {
        status,
      },
      {
        _id: proposalId,
      },
    );
    const redis = this.redisHelper;
    const projectId = proposal.projectId.toString();

    await redis.del(`proposal:${proposalId}`);
    await redis.del(`proposal:pending-updates:${project.clientId}`);
    await redis.del(`proposals:project:${projectId}:version`);
    await redis.del(`project:proposals:count:${projectId}`);

    return response(null, messages.proposal.updateStatus.success);
  }
}
