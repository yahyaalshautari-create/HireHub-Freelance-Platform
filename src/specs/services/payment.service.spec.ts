import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from 'src/enums/payment.enum';
import { UserRole } from 'src/enums/user.enum';
import { NotificationType } from 'src/enums/notification.enum';
import { PaymentService } from 'src/services/payment.service';
import { NotificationService } from 'src/services/notification.service';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockPaymentRepository = {
  findById: jest.fn(),
  findByUserId: jest.fn(),
  create: jest.fn(),
};

const mockContractRepository = {
  findByPk: jest.fn(),
};

const mockUserRepository = {
  findByPk: jest.fn(),
  update: jest.fn(),
};

const mockProposalRepository = {
  findByPk: jest.fn(),
};

const mockNotificationService = {
  createNotification: jest.fn(),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const buildContract = (overrides = {}) => ({
  _id: 'contract-id-1',
  clientId: 'client-id-1',
  freelancerId: 'freelancer-id-1',
  proposalId: 'proposal-id-1',
  ...overrides,
});

const buildProposal = (overrides = {}) => ({
  _id: 'proposal-id-1',
  price: 500,
  ...overrides,
});

const buildUser = (overrides = {}) => ({
  _id: 'user-id-1',
  balance: 1000,
  frozenBalance: 0,
  ...overrides,
});

const buildPayment = (overrides = {}) => ({
  _id: 'payment-id-1',
  clientId: 'client-id-1',
  freelancerId: 'freelancer-id-1',
  contractId: 'contract-id-1',
  amount: 500,
  status: PaymentStatus.HELD,
  isReleased: false,
  releasedAt: null,
  refundedAt: null,
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

const buildAuthUser = (overrides: any = {}) => ({
  _id: 'client-id-1',
  role: UserRole.CLIENT,
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: 'IPaymentRepository', useValue: mockPaymentRepository },
        { provide: 'IContractRepository', useValue: mockContractRepository },
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: 'IProposalRepository', useValue: mockProposalRepository },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    jest.clearAllMocks();
  });

  // ── createPayment ─────────────────────────────────────────────────────────────

  describe('createPayment', () => {
    it('should throw NotFoundException if contract not found', async () => {
      mockContractRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.createPayment('contract-id', 'client-id-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if clientId does not match contract.clientId', async () => {
      mockContractRepository.findByPk.mockResolvedValue(
        buildContract({ clientId: 'other-client' }),
      );

      await expect(
        service.createPayment('contract-id', 'client-id-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if client user not found', async () => {
      mockContractRepository.findByPk.mockResolvedValue(buildContract());
      mockUserRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.createPayment('contract-id', 'client-id-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if proposal not found', async () => {
      mockContractRepository.findByPk.mockResolvedValue(buildContract());
      mockUserRepository.findByPk.mockResolvedValue(buildUser());
      mockProposalRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.createPayment('contract-id', 'client-id-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if client has insufficient balance', async () => {
      mockContractRepository.findByPk.mockResolvedValue(buildContract());
      mockUserRepository.findByPk.mockResolvedValue(
        buildUser({ balance: 100 }),
      );
      mockProposalRepository.findByPk.mockResolvedValue(
        buildProposal({ price: 500 }),
      );

      await expect(
        service.createPayment('contract-id', 'client-id-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should deduct balance, create payment, and send notification', async () => {
      const client = buildUser({ balance: 1000, frozenBalance: 0 });
      const payment = buildPayment();
      mockContractRepository.findByPk.mockResolvedValue(buildContract());
      mockUserRepository.findByPk.mockResolvedValue(client);
      mockProposalRepository.findByPk.mockResolvedValue(buildProposal());
      mockUserRepository.update.mockResolvedValue(true);
      mockPaymentRepository.create.mockResolvedValue(payment);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const result = await service.createPayment('contract-id', 'client-id-1');

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { balance: 500, frozenBalance: 500 },
        { _id: 'client-id-1' },
      );
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.HELD, amount: 500 }),
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.PROPOSAL }),
      );
      expect(result).toBeDefined();
    });
  });

  // ── getPaymentsUser ───────────────────────────────────────────────────────────

  describe('getPaymentsUser', () => {
    it('should return payments for user', async () => {
      const payments = [buildPayment(), buildPayment({ _id: 'payment-2' })];
      mockPaymentRepository.findByUserId.mockResolvedValue(payments);

      const result = await service.getPaymentsUser('user-id-1');

      expect(mockPaymentRepository.findByUserId).toHaveBeenCalledWith(
        'user-id-1',
      );
      expect(result).toBeDefined();
    });
  });

  // ── releasePayment ────────────────────────────────────────────────────────────

  describe('releasePayment', () => {
    it('should throw NotFoundException if payment not found', async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(
        service.releasePayment(buildAuthUser(), 'payment-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not client or admin', async () => {
      mockPaymentRepository.findById.mockResolvedValue(
        buildPayment({ clientId: 'other-client' }),
      );

      await expect(
        service.releasePayment(
          buildAuthUser({ _id: 'random-user', role: UserRole.FREELANCER }),
          'payment-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if payment is not HELD', async () => {
      mockPaymentRepository.findById.mockResolvedValue(
        buildPayment({ status: PaymentStatus.RELEASED }),
      );

      await expect(
        service.releasePayment(buildAuthUser(), 'payment-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if freelancer or client not found', async () => {
      mockPaymentRepository.findById.mockResolvedValue(buildPayment());
      mockUserRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.releasePayment(buildAuthUser(), 'payment-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should release payment: credit freelancer, debit client frozenBalance', async () => {
      const payment = buildPayment();
      const freelancer = buildUser({ _id: 'freelancer-id-1', balance: 0 });
      const client = buildUser({ _id: 'client-id-1', frozenBalance: 500 });

      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockUserRepository.findByPk
        .mockResolvedValueOnce(freelancer)
        .mockResolvedValueOnce(client);
      mockUserRepository.update.mockResolvedValue(true);

      const result = await service.releasePayment(
        buildAuthUser(),
        'payment-id',
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { balance: 500 },
        { _id: freelancer._id },
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { frozenBalance: 0 },
        { _id: client._id },
      );
      expect(payment.save).toHaveBeenCalled();
      expect(payment.status).toBe(PaymentStatus.RELEASED);
      expect(payment.isReleased).toBe(true);
      expect(result).toBeDefined();
    });

    it('should allow ADMIN to release any payment', async () => {
      const payment = buildPayment({ clientId: 'other-client' });
      const freelancer = buildUser({ _id: 'freelancer-id-1' });
      const client = buildUser({ _id: 'other-client', frozenBalance: 500 });

      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockUserRepository.findByPk
        .mockResolvedValueOnce(freelancer)
        .mockResolvedValueOnce(client);
      mockUserRepository.update.mockResolvedValue(true);

      const result = await service.releasePayment(
        buildAuthUser({ _id: 'admin-id', role: UserRole.ADMIN }),
        'payment-id',
      );

      expect(result).toBeDefined();
    });
  });

  // ── refundPayment ─────────────────────────────────────────────────────────────

  describe('refundPayment', () => {
    it('should throw NotFoundException if payment not found', async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(
        service.refundPayment(
          buildAuthUser({ role: UserRole.ADMIN }),
          'payment-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not admin', async () => {
      mockPaymentRepository.findById.mockResolvedValue(buildPayment());

      await expect(
        service.refundPayment(
          buildAuthUser({ role: UserRole.CLIENT }),
          'payment-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if client not found', async () => {
      mockPaymentRepository.findById.mockResolvedValue(buildPayment());
      mockUserRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.refundPayment(
          buildAuthUser({ role: UserRole.ADMIN }),
          'payment-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should refund payment: credit client balance, debit frozenBalance', async () => {
      const payment = buildPayment();
      const client = buildUser({
        _id: 'client-id-1',
        balance: 0,
        frozenBalance: 500,
      });

      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockUserRepository.findByPk.mockResolvedValue(client);
      mockUserRepository.update.mockResolvedValue(true);

      const result = await service.refundPayment(
        buildAuthUser({ role: UserRole.ADMIN }),
        'payment-id',
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { balance: 500, frozenBalance: 0 },
        { _id: client._id },
      );
      expect(payment.status).toBe(PaymentStatus.REFUNDED);
      expect(payment.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── rechargeBalance ───────────────────────────────────────────────────────────

  describe('rechargeBalance', () => {
    it('should throw BadRequestException if amount is zero or negative', async () => {
      await expect(service.rechargeBalance('user-id', 0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.rechargeBalance('user-id', -50)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.rechargeBalance('non-existent', 100),
      ).rejects.toThrow(NotFoundException);
    });

    it('should add amount to user balance and return new balance', async () => {
      const user = buildUser({ balance: 200 });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);

      const result = await service.rechargeBalance('user-id-1', 300);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { balance: 500 },
        { _id: 'user-id-1' },
      );
      expect(result).toBeDefined();
    });
  });
});
