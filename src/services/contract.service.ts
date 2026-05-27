import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContractStatus } from 'src/enums/contract.enum';
import { ProposalStatus } from 'src/enums/proposal.enum';
import { UserRole } from 'src/enums/user.enum';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import type { IProjectRepository } from 'src/interfaces/project.interface';
import type { IProposalRepository } from 'src/interfaces/proposal.interface';
import type { IContractRepository } from 'src/interfaces/contract.interface';
import { response } from 'src/libs/helpers';
import { messages } from 'src/libs/messages';
import { NotificationService } from './notification.service';
import { NotificationType } from 'src/enums/notification.enum';

@Injectable()
export class ContractService {
  constructor(
    @Inject('IContractRepository')
    private readonly contractRepository: IContractRepository,

    @Inject('IProposalRepository')
    private readonly proposalRepository: IProposalRepository,

    @Inject('IProjectRepository')
    private readonly projectRepository: IProjectRepository,

    private readonly notificationService: NotificationService,
  ) {}

  async createContract(authUser: AuthUser, proposalId: string) {
    const proposal = await this.proposalRepository.findByPk(proposalId);

    if (!proposal) {
      throw new NotFoundException(messages.proposal.notFound);
    }

    if (proposal.status !== ProposalStatus.ACCEPTED) {
      throw new BadRequestException(messages.proposal.notAccepted);
    }

    const project = await this.projectRepository.findByPk(proposal.projectId);

    if (!project) {
      throw new NotFoundException(messages.project.notFound);
    }

    if (project.clientId !== authUser._id) {
      throw new BadRequestException(messages.project.forbidden);
    }

    const existContract = await this.contractRepository.findOne({
      proposalId,
    });

    if (existContract) {
      throw new BadRequestException(messages.contract.alreadyExists);
    }

    const contract = await this.contractRepository.create({
      projectId: proposal.projectId,
      proposalId: proposal._id.toString(),
      clientId: project.clientId,
      freelancerId: proposal.freelancerId,
      status: ContractStatus.ACTIVE,
      startedAt: new Date(),
      completedAt: null,
    });

    await Promise.all([
      this.notificationService.createNotification({
        receiverId: project.clientId,
        senderId: contract.freelancerId,
        type: NotificationType.CONTRACT,
        targetId: contract._id.toString(),
        isRead: false,
      }),

      this.notificationService.createNotification({
        receiverId: contract.freelancerId,
        senderId: project.clientId,
        type: NotificationType.CONTRACT,
        targetId: contract._id.toString(),
        isRead: false,
      }),
    ]);

    return response(contract, messages.contract.create.success);
  }

  async getAllContracts(page = 1, limit = 10) {
    const contracts = await this.contractRepository.findAll(page, limit);

    const total = await this.contractRepository.count();

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

  async getMyContractWithUser(authUser: AuthUser, otherUserId: string) {
    const filter =
      authUser.role === UserRole.CLIENT
        ? {
            clientId: authUser._id,
            freelancerId: otherUserId,
          }
        : {
            clientId: otherUserId,
            freelancerId: authUser._id,
          };

    const contract = await this.contractRepository.findOne(filter);

    if (!contract) {
      throw new NotFoundException(messages.contract.notFound);
    }

    return response(contract, null);
  }

  async getContractById(contractId: string) {
    const contract = await this.contractRepository.findByPk(contractId);

    if (!contract) {
      throw new NotFoundException(messages.contract.notFound);
    }

    return response(contract, null);
  }

  async deleteContract(contractId: string) {
    const contract = await this.contractRepository.findByPk(contractId);

    if (!contract) {
      throw new NotFoundException(messages.contract.notFound);
    }

    if (contract.status === ContractStatus.ACTIVE) {
      throw new BadRequestException(messages.contract.forbidden);
    }

    await this.contractRepository.destroy({
      _id: contractId,
    });

    return response(null, messages.contract.delete.success);
  }
}
