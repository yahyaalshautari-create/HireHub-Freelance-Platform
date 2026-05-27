import { Inject, Injectable } from '@nestjs/common';
import type { IUserRepository } from 'src/interfaces/user.interface';
import type { IProposalRepository } from 'src/interfaces/proposal.interface';
import type { IProjectRepository } from 'src/interfaces/project.interface';
import type { IContractRepository } from 'src/interfaces/contract.interface';
import type { IMessageRepository } from 'src/interfaces/message.interface';
import type { IPaymentRepository } from 'src/interfaces/payment.interface';
import type { IFreelancerRepository } from 'src/interfaces/freelancer.interface';
import type { IClientRepository } from 'src/interfaces/client.interface';

@Injectable()
export class UserCleanupService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('IProposalRepository')
    private readonly proposalRepository: IProposalRepository,
    @Inject('IProjectRepository')
    private readonly projectRepository: IProjectRepository,
    @Inject('IContractRepository')
    private readonly contractRepository: IContractRepository,
    @Inject('IMessageRepository')
    private readonly messageRepository: IMessageRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IFreelancerRepository')
    private readonly freelancerRepository: IFreelancerRepository,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  async cleanup(userId: string): Promise<void> {
    await Promise.all([
      this.proposalRepository.deleteAll({
        $or: [{ freelancerId: userId }, { clientId: userId }],
      }),

      this.projectRepository.deleteAll({
        clientId: userId,
      }),

      this.contractRepository.deleteAll({
        $or: [{ clientId: userId }, { freelancerId: userId }],
      }),

      this.messageRepository.deleteAll({
        $or: [{ senderId: userId }, { receiverId: userId }],
      }),

      this.paymentRepository.deleteAll({
        $or: [{ clientId: userId }, { freelancerId: userId }],
      }),

      this.freelancerRepository.deleteAll({
        freelancerId: userId,
      }),

      this.clientRepository.deleteAll({
        clientId: userId,
      }),
    ]);

    await this.userRepository.destroy({
      _id: userId,
    });
  }
}
