import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ContractStatus, ReviewContractStatus } from 'src/enums/contract.enum';
import { ProjectStatus } from 'src/enums/project.enum';
import { ProposalStatus } from 'src/enums/proposal.enum';
import { UserRole } from 'src/enums/user.enum';
import { NotificationType } from 'src/enums/notification.enum';
import { ContractOptionService } from 'src/services/contract-option.service';
import { NotificationService } from 'src/services/notification.service';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockContractOptionRepository = {
  findByPk: jest.fn(),
  update: jest.fn(),
  findPendingRequests: jest.fn(),
  countPendingRequests: jest.fn(),
};

const mockProposalOptionRepository = {
  findByPk: jest.fn(),
  update: jest.fn(),
};

const mockProjectRepository = {
  update: jest.fn(),
};

const mockUserRepository = {
  findByPk: jest.fn(),
  update: jest.fn(),
};

const mockFreelancerRepository = {
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockNotificationService = {
  createNotification: jest.fn(),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const buildContract = (overrides = {}) => ({
  _id: { toString: () => 'contract-id-1' },
  projectId: 'project-id-1',
  proposalId: 'proposal-id-1',
  clientId: 'client-id-1',
  freelancerId: 'freelancer-id-1',
  status: ContractStatus.ACTIVE,
  cancelRequested: false,
  cancelRequestedBy: null,
  reviewContractStatus: null,
  ...overrides,
});

const buildProposal = (overrides = {}) => ({
  _id: { toString: () => 'proposal-id-1' },
  price: 500,
  status: ProposalStatus.ACCEPTED,
  ...overrides,
});

const buildUser = (overrides = {}) => ({
  _id: 'user-id-1',
  balance: 1000,
  frozenBalance: 500,
  ...overrides,
});

const buildFreelancerProfile = (overrides = {}) => ({
  freelancerId: 'freelancer-id-1',
  completedProjects: 5,
  totalEarnings: 2000,
  underImplementationProjects: 2,
  ...overrides,
});

const buildAuthUser = (overrides: any = {}): any => ({
  _id: 'client-id-1',
  role: UserRole.CLIENT,
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('ContractOptionService', () => {
  let service: ContractOptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractOptionService,
        {
          provide: 'IContractOptionRepository',
          useValue: mockContractOptionRepository,
        },
        {
          provide: 'IProposalOptionRepository',
          useValue: mockProposalOptionRepository,
        },
        { provide: 'IProjectRepository', useValue: mockProjectRepository },
        { provide: 'IUserRepository', useValue: mockUserRepository },
        {
          provide: 'IFreelancerRepository',
          useValue: mockFreelancerRepository,
        },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<ContractOptionService>(ContractOptionService);
    jest.clearAllMocks();
  });

  // ── completeContract ──────────────────────────────────────────────────────────

  describe('completeContract', () => {
    it('should throw NotFoundException if contract not found', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.completeContract(buildAuthUser(), 'contract-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not the client', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(
        buildContract({ clientId: 'other-client' }),
      );

      await expect(
        service.completeContract(
          buildAuthUser({ _id: 'wrong-user' }),
          'contract-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if contract is already completed', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(
        buildContract({ status: ContractStatus.COMPLETED }),
      );

      await expect(
        service.completeContract(buildAuthUser(), 'contract-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if proposal not found', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(buildContract());
      mockProposalOptionRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.completeContract(buildAuthUser(), 'contract-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if client not found', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(buildContract());
      mockProposalOptionRepository.findByPk.mockResolvedValue(buildProposal());
      mockUserRepository.findByPk.mockResolvedValueOnce(null);

      await expect(
        service.completeContract(buildAuthUser(), 'contract-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if freelancer not found', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(buildContract());
      mockProposalOptionRepository.findByPk.mockResolvedValue(buildProposal());
      mockUserRepository.findByPk
        .mockResolvedValueOnce(buildUser({ _id: 'client-id-1' })) // client found
        .mockResolvedValueOnce(null); // freelancer not found

      await expect(
        service.completeContract(buildAuthUser(), 'contract-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should complete contract, update balances, project, freelancer, and notify client', async () => {
      const contract = buildContract();
      const proposal = buildProposal();
      const client = buildUser({ _id: 'client-id-1', frozenBalance: 500 });
      const freelancer = buildUser({ _id: 'freelancer-id-1', balance: 0 });
      const freelancerProfile = buildFreelancerProfile();

      mockContractOptionRepository.findByPk.mockResolvedValue(contract);
      mockProposalOptionRepository.findByPk.mockResolvedValue(proposal);
      mockUserRepository.findByPk
        .mockResolvedValueOnce(client)
        .mockResolvedValueOnce(freelancer);
      mockUserRepository.update.mockResolvedValue(true);
      mockContractOptionRepository.update.mockResolvedValue(true);
      mockProjectRepository.update.mockResolvedValue(true);
      mockFreelancerRepository.findOne.mockResolvedValue(freelancerProfile);
      mockFreelancerRepository.update.mockResolvedValue(true);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const result = await service.completeContract(
        buildAuthUser(),
        'contract-id',
      );

      // client frozenBalance reduced
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { frozenBalance: 0 }, // 500 - 500
        { _id: 'client-id-1' },
      );
      // freelancer balance increased
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { balance: 500 }, // 0 + 500
        { _id: 'freelancer-id-1' },
      );
      // contract marked completed
      expect(mockContractOptionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: ContractStatus.COMPLETED }),
        { _id: 'contract-id' },
      );
      // project marked completed
      expect(mockProjectRepository.update).toHaveBeenCalledWith(
        'project-id-1',
        {
          status: ProjectStatus.COMPLETED,
        },
      );
      // notification sent to client
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.CONTRACT_COMPLETED }),
      );
      expect(result).toBeDefined();
    });
  });

  // ── requestCancelContract ─────────────────────────────────────────────────────

  describe('requestCancelContract', () => {
    it('should throw NotFoundException if contract not found', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.requestCancelContract(buildAuthUser(), 'contract-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not client or freelancer', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(buildContract());

      await expect(
        service.requestCancelContract(
          buildAuthUser({ _id: 'random-user' }),
          'contract-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if contract is not ACTIVE', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(
        buildContract({ status: ContractStatus.COMPLETED }),
      );

      await expect(
        service.requestCancelContract(buildAuthUser(), 'contract-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if cancel already requested', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(
        buildContract({ cancelRequested: true }),
      );

      await expect(
        service.requestCancelContract(buildAuthUser(), 'contract-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set cancelRequested and notify the other party (client requests → notify freelancer)', async () => {
      const contract = buildContract();
      mockContractOptionRepository.findByPk.mockResolvedValue(contract);
      mockContractOptionRepository.update.mockResolvedValue(true);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const authUser = buildAuthUser({
        _id: 'client-id-1',
        role: UserRole.CLIENT,
      });
      const result = await service.requestCancelContract(
        authUser,
        'contract-id',
      );

      expect(mockContractOptionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ cancelRequested: true }),
        { _id: 'contract-id' },
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ receiverId: 'freelancer-id-1' }),
      );
      expect(result).toBeDefined();
    });
  });

  // ── getPendingCancelRequests ───────────────────────────────────────────────────

  describe('getPendingCancelRequests', () => {
    it('should throw ForbiddenException if caller is not ADMIN or SUPPORT', async () => {
      await expect(
        service.getPendingCancelRequests(
          buildAuthUser({ role: UserRole.CLIENT }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return pending requests for ADMIN', async () => {
      const contracts = [buildContract()];
      mockContractOptionRepository.findPendingRequests.mockResolvedValue(
        contracts,
      );
      mockContractOptionRepository.countPendingRequests.mockResolvedValue(1);

      const result = await service.getPendingCancelRequests(
        buildAuthUser({ role: UserRole.ADMIN }),
        1,
        10,
      );

      expect(result).toBeDefined();
    });

    it('should return pending requests for SUPPORT', async () => {
      mockContractOptionRepository.findPendingRequests.mockResolvedValue([]);
      mockContractOptionRepository.countPendingRequests.mockResolvedValue(0);

      const result = await service.getPendingCancelRequests(
        buildAuthUser({ role: UserRole.SUPPORT }),
      );

      expect(result).toBeDefined();
    });
  });

  // ── reviewCancelContract ──────────────────────────────────────────────────────

  describe('reviewCancelContract', () => {
    const adminUser = buildAuthUser({ _id: 'admin-id', role: UserRole.ADMIN });

    const pendingContract = buildContract({
      cancelRequested: true,
      cancelRequestedBy: UserRole.CLIENT,
      reviewContractStatus: ReviewContractStatus.PENDING,
    });

    it('should throw NotFoundException if contract not found', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.reviewCancelContract(
          adminUser,
          'contract-id',
          ReviewContractStatus.APPROVED,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not ADMIN or SUPPORT', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(pendingContract);

      await expect(
        service.reviewCancelContract(
          buildAuthUser({ role: UserRole.CLIENT }),
          'contract-id',
          ReviewContractStatus.APPROVED,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if contract has no pending cancel request', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(
        buildContract({ cancelRequested: false }),
      );

      await expect(
        service.reviewCancelContract(
          adminUser,
          'contract-id',
          ReviewContractStatus.APPROVED,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if reviewer has same role as requester', async () => {
      // Admin requested, Admin reviews → forbidden
      mockContractOptionRepository.findByPk.mockResolvedValue(
        buildContract({
          cancelRequested: true,
          cancelRequestedBy: UserRole.ADMIN,
          reviewContractStatus: ReviewContractStatus.PENDING,
        }),
      );

      await expect(
        service.reviewCancelContract(
          adminUser,
          'contract-id',
          ReviewContractStatus.APPROVED,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject cancel request and update repository', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(pendingContract);
      mockContractOptionRepository.update.mockResolvedValue(true);

      const result = await service.reviewCancelContract(
        adminUser,
        'contract-id',
        ReviewContractStatus.REJECTED,
      );

      expect(mockContractOptionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          reviewContractStatus: ReviewContractStatus.REJECTED,
        }),
        { _id: 'contract-id' },
      );
      expect(result).toBeDefined();
    });

    it('should approve cancel: refund client, reset proposal/project, notify both parties', async () => {
      const contract = pendingContract;
      const proposal = buildProposal();
      const client = buildUser({
        _id: 'client-id-1',
        frozenBalance: 500,
        balance: 0,
      });
      const freelancerProfile = buildFreelancerProfile({
        underImplementationProjects: 2,
      });

      mockContractOptionRepository.findByPk.mockResolvedValue(contract);
      mockProposalOptionRepository.findByPk.mockResolvedValue(proposal);
      mockUserRepository.findByPk.mockResolvedValue(client);
      mockUserRepository.update.mockResolvedValue(true);
      mockProposalOptionRepository.update.mockResolvedValue(true);
      mockProjectRepository.update.mockResolvedValue(true);
      mockFreelancerRepository.findOne.mockResolvedValue(freelancerProfile);
      mockFreelancerRepository.update.mockResolvedValue(true);
      mockContractOptionRepository.update.mockResolvedValue(true);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const result = await service.reviewCancelContract(
        adminUser,
        'contract-id',
        ReviewContractStatus.APPROVED,
      );

      // refund: frozenBalance - price, balance + price
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { frozenBalance: 0, balance: 500 },
        { _id: 'client-id-1' },
      );
      // proposal reset to PENDING
      expect(mockProposalOptionRepository.update).toHaveBeenCalledWith(
        { status: ProposalStatus.PENDING },
        { _id: 'proposal-id-1' },
      );
      // project reset to OPEN
      expect(mockProjectRepository.update).toHaveBeenCalledWith(
        'project-id-1',
        {
          status: ProjectStatus.OPEN,
        },
      );
      // contract cancelled
      expect(mockContractOptionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: ContractStatus.CANCELLED }),
        { _id: 'contract-id' },
      );
      // two notifications (client + freelancer)
      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(
        2,
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if client has insufficient frozen balance', async () => {
      mockContractOptionRepository.findByPk.mockResolvedValue(pendingContract);
      mockProposalOptionRepository.findByPk.mockResolvedValue(
        buildProposal({ price: 1000 }),
      );
      mockUserRepository.findByPk.mockResolvedValue(
        buildUser({ frozenBalance: 100 }),
      );

      await expect(
        service.reviewCancelContract(
          adminUser,
          'contract-id',
          ReviewContractStatus.APPROVED,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
