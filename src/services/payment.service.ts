import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from 'src/enums/user.enum';
import { PaymentStatus } from 'src/enums/payment.enum';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import type { IContractRepository } from 'src/interfaces/contract.interface';
import type { IUserRepository } from 'src/interfaces/user.interface';
import type { IProposalRepository } from 'src/interfaces/proposal.interface';
import type { IPaymentRepository } from 'src/interfaces/payment.interface';
import { messages } from 'src/libs/messages';
import { response } from 'src/libs/helpers';
import { NotificationService } from './notification.service';
import { NotificationType } from 'src/enums/notification.enum';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,

    @Inject('IContractRepository')
    private readonly contractRepository: IContractRepository,

    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,

    @Inject('IProposalRepository')
    private readonly proposalRepository: IProposalRepository,

    private readonly notificationService: NotificationService,
  ) {}

  async createPayment(contractId: string, clientId: string) {
    const contract = await this.contractRepository.findByPk(contractId);

    if (!contract) {
      throw new NotFoundException(messages.contract.notFound);
    }

    if (contract.clientId !== clientId) {
      throw new ForbiddenException(messages.contract.forbidden);
    }

    const client = await this.userRepository.findByPk(clientId);

    if (!client) {
      throw new NotFoundException(messages.user.getUser.notFound);
    }

    const proposal = await this.proposalRepository.findByPk(
      contract.proposalId,
    );

    if (!proposal) {
      throw new NotFoundException(messages.proposal.notFound);
    }

    const amount = proposal.price;

    if (client.balance < amount) {
      throw new BadRequestException(messages.client.insufficientBalance);
    }

    await this.userRepository.update(
      {
        balance: (client.balance || 0) - amount,
        frozenBalance: (client.frozenBalance || 0) + amount,
      },
      {
        _id: clientId,
      },
    );

    const payment = await this.paymentRepository.create({
      clientId,
      freelancerId: contract.freelancerId,
      contractId,
      amount,
      status: PaymentStatus.HELD,
    });

    await this.notificationService.createNotification({
      receiverId: clientId,
      senderId: contract.freelancerId,
      type: NotificationType.PROPOSAL,
      targetId: payment._id.toString(),
      isRead: false,
    });

    return response(payment, messages.payment.create.success);
  }

  async getPaymentsUser(userId: string) {
    const payments = await this.paymentRepository.findByUserId(userId);
    return response(payments, null);
  }

  async releasePayment(authUser: AuthUser, paymentId: string) {
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundException(messages.payment.notFound);
    }

    const isClient = payment.clientId === authUser._id;
    const isAdmin = authUser.role === UserRole.ADMIN;

    if (!isClient && !isAdmin) {
      throw new ForbiddenException(messages.client.forbidden);
    }

    if (payment.status !== PaymentStatus.HELD) {
      throw new BadRequestException('This payment cannot be released.');
    }

    const freelancer = await this.userRepository.findByPk(payment.freelancerId);

    const client = await this.userRepository.findByPk(payment.clientId);

    if (!freelancer || !client) {
      throw new NotFoundException(messages.user.getUser.notFound);
    }

    await this.userRepository.update(
      {
        balance: (freelancer.balance || 0) + payment.amount,
      },
      { _id: freelancer._id },
    );

    await this.userRepository.update(
      {
        frozenBalance: (client.frozenBalance || 0) - payment.amount,
      },
      { _id: client._id },
    );

    payment.status = PaymentStatus.RELEASED;
    payment.isReleased = true;
    payment.releasedAt = new Date();

    await payment.save();

    return response(payment, null);
  }

  async refundPayment(authUser: AuthUser, paymentId: string) {
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundException(messages.payment.notFound);
    }

    if (authUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(messages.payment.admin);
    }

    const client = await this.userRepository.findByPk(payment.clientId);

    if (!client) {
      throw new NotFoundException(messages.user.getUser.notFound);
    }

    await this.userRepository.update(
      {
        balance: (client.balance || 0) + payment.amount,
        frozenBalance: (client.frozenBalance || 0) - payment.amount,
      },
      { _id: client._id },
    );

    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();

    await payment.save();

    return response(payment, null);
  }

  async rechargeBalance(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException(messages.payment.invalidAmount);
    }

    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new NotFoundException(messages.user.getUser.notFound);
    }

    await this.userRepository.update(
      {
        balance: (user.balance || 0) + amount,
      },
      { _id: userId },
    );

    return response((user.balance || 0) + amount, null);
  }
}
