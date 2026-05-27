import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContractStatus, ReviewContractStatus } from 'src/enums/contract.enum';
import { NotificationType } from 'src/enums/notification.enum';
import { ProjectStatus } from 'src/enums/project.enum';
import { ProposalStatus } from 'src/enums/proposal.enum';
import { UserRole } from 'src/enums/user.enum';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import type { IContractOptionRepository } from 'src/interfaces/contract-option.interface';
import type { IFreelancerRepository } from 'src/interfaces/freelancer.interface';
import type { IProjectRepository } from 'src/interfaces/project.interface';
import type { IProposalOptionRepository } from 'src/interfaces/proposal-option.interface';
import type { IUserRepository } from 'src/interfaces/user.interface';
import { assertOwnerOrAdmin, response } from 'src/libs/helpers';
import { messages } from 'src/libs/messages';
import { NotificationService } from './notification.service';

@Injectable()
export class ContractOptionService {
  constructor(
    @Inject('IContractOptionRepository')
    private readonly contractOptionRepository: IContractOptionRepository,

    @Inject('IProposalOptionRepository')
    private readonly proposalOptionRepository: IProposalOptionRepository,

    @Inject('IProjectRepository')
    private readonly projectRepository: IProjectRepository,

    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,

    @Inject('IFreelancerRepository')
    private readonly freelancerRepository: IFreelancerRepository,

    private readonly notificationService: NotificationService,
  ) {}

  async completeContract(authUser: AuthUser, contractId: string) {
    const contract = await this.contractOptionRepository.findByPk(contractId);

    if (!contract) {
      throw new NotFoundException(messages.contract.notFound);
    }

    assertOwnerOrAdmin({
      ownerId: contract.clientId,
      authUser,
      message: messages.contract.forbidden,
    });

    if (contract.status === ContractStatus.COMPLETED) {
      throw new BadRequestException(messages.contract.alreadyCompleted);
    }

    const proposal = await this.proposalOptionRepository.findByPk(
      contract.proposalId,
    );

    if (!proposal) {
      throw new NotFoundException(messages.proposal.notFound);
    }

    const price = proposal.price;

    const client = await this.userRepository.findByPk(contract.clientId);

    if (!client) {
      throw new NotFoundException(messages.client.notFound);
    }

    const freelancer = await this.userRepository.findByPk(
      contract.freelancerId,
    );

    if (!freelancer) {
      throw new NotFoundException(messages.freelancer.notFound);
    }

    await this.userRepository.update(
      {
        frozenBalance: (client.frozenBalance || 0) - price,
      },
      {
        _id: contract.clientId,
      },
    );

    await this.userRepository.update(
      {
        balance: (freelancer.balance || 0) + price,
      },
      {
        _id: contract.freelancerId,
      },
    );

    await this.contractOptionRepository.update(
      {
        status: ContractStatus.COMPLETED,
        completedAt: new Date(),
      },
      {
        _id: contractId,
      },
    );

    await this.projectRepository.update(contract.projectId, {
      status: ProjectStatus.COMPLETED,
    });

    const freelancerProfile = await this.freelancerRepository.findOne({
      freelancerId: contract.freelancerId,
    });

    if (freelancerProfile) {
      await this.freelancerRepository.update(
        {
          freelancerId: contract.freelancerId,
        },
        {
          completedJobs: (freelancerProfile.completedProjects || 0) + 1,

          totalEarnings: (freelancerProfile.totalEarnings || 0) + price,

          underImplementationProject:
            (freelancerProfile.underImplementationProjects || 1) - 1,
        },
      );
    }

    await this.notificationService.createNotification({
      receiverId: contract.clientId,
      senderId: contract.freelancerId,
      type: NotificationType.CONTRACT_COMPLETED,
      targetId: contract._id.toString(),
      isRead: false,
    });

    return response(null, messages.contract.completed);
  }

  async requestCancelContract(authUser: AuthUser, contractId: string) {
    const contract = await this.contractOptionRepository.findByPk(contractId);

    if (!contract) {
      throw new NotFoundException(messages.contract.notFound);
    }

    const isClient = contract.clientId === authUser._id;
    const isFreelancer = contract.freelancerId === authUser._id;

    if (!isClient && !isFreelancer) {
      throw new ForbiddenException(messages.contract.forbidden);
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException(messages.contract.invalidStatus);
    }

    if (contract.cancelRequested) {
      throw new BadRequestException(messages.contract.cancelAlreadyRequested);
    }

    await this.contractOptionRepository.update(
      {
        cancelRequested: true,
        cancelRequestedBy: authUser.role,
        reviewContractStatus: ReviewContractStatus.PENDING,
      },
      {
        _id: contractId,
      },
    );

    const receiverId = isClient ? contract.freelancerId : contract.clientId;

    await this.notificationService.createNotification({
      receiverId,
      senderId: authUser._id,
      type: NotificationType.REQUEST_CONTRACT,
      targetId: contract._id.toString(),
      isRead: false,
    });

    return response(null, messages.contract.request.success);
  }

  async getPendingCancelRequests(authUser: AuthUser, page = 1, limit = 10) {
    if (
      authUser.role !== UserRole.ADMIN &&
      authUser.role !== UserRole.SUPPORT
    ) {
      throw new ForbiddenException(messages.contract.review.forbidden);
    }

    const contracts = await this.contractOptionRepository.findPendingRequests(
      page,
      limit,
    );

    const total = await this.contractOptionRepository.countPendingRequests();

    const skip = (page - 1) * limit;

    const hasMore = skip + contracts.length < total;

    return response(
      {
        contracts,
        total,
        hasMore,
      },
      null,
    );
  }

  async reviewCancelContract(
    authUser: AuthUser,
    contractId: string,
    status: ReviewContractStatus,
  ) {
    const contract = await this.contractOptionRepository.findByPk(contractId);

    if (!contract) {
      throw new NotFoundException(messages.contract.notFound);
    }

    if (
      authUser.role !== UserRole.ADMIN &&
      authUser.role !== UserRole.SUPPORT
    ) {
      throw new ForbiddenException(messages.contract.review.forbidden);
    }

    if (
      !contract.cancelRequested ||
      contract.reviewContractStatus !== ReviewContractStatus.PENDING
    ) {
      throw new BadRequestException(messages.contract.review.invalidRequest);
    }

    if (contract.cancelRequestedBy === authUser.role) {
      throw new ForbiddenException(messages.contract.review.forbidden);
    }

    if (status === ReviewContractStatus.REJECTED) {
      await this.contractOptionRepository.update(
        {
          reviewContractStatus: ReviewContractStatus.REJECTED,

          cancelRequested: false,
        },
        {
          _id: contractId,
        },
      );

      return response(null, messages.contract.review.rejected);
    }

    const proposal = await this.proposalOptionRepository.findByPk(
      contract.proposalId,
    );

    if (!proposal) {
      throw new NotFoundException(messages.proposal.notFound);
    }

    const price = proposal.price;

    const client = await this.userRepository.findByPk(contract.clientId);

    if (!client) {
      throw new NotFoundException(messages.client.notFound);
    }

    if ((client.frozenBalance || 0) < price) {
      throw new BadRequestException(messages.client.insufficientBalance);
    }

    await this.userRepository.update(
      {
        frozenBalance: (client.frozenBalance || 0) - price,

        balance: (client.balance || 0) + price,
      },
      {
        _id: contract.clientId,
      },
    );

    await this.proposalOptionRepository.update(
      {
        status: ProposalStatus.PENDING,
      },
      {
        _id: contract.proposalId,
      },
    );

    await this.projectRepository.update(contract.projectId, {
      status: ProjectStatus.OPEN,
    });

    const freelancerProfile = await this.freelancerRepository.findOne({
      freelancerId: contract.freelancerId,
    });

    if (freelancerProfile) {
      await this.freelancerRepository.update(
        {
          freelancerId: contract.freelancerId,
        },
        {
          underImplementationProjects:
            (freelancerProfile.underImplementationProjects || 1) - 1,
        },
      );
    }

    await this.contractOptionRepository.update(
      {
        status: ContractStatus.CANCELLED,
        reviewContractStatus: ReviewContractStatus.APPROVED,
      },
      {
        _id: contractId,
      },
    );

    await Promise.all([
      this.notificationService.createNotification({
        receiverId: contract.clientId,
        senderId: authUser._id,
        type: NotificationType.REJECTED_CONTRACT,
        targetId: contract._id.toString(),
        isRead: false,
      }),

      this.notificationService.createNotification({
        receiverId: contract.freelancerId,
        senderId: authUser._id,
        type: NotificationType.REJECTED_CONTRACT,
        targetId: contract._id.toString(),
        isRead: false,
      }),
    ]);

    return response(null, messages.contract.review.success);
  }
}
