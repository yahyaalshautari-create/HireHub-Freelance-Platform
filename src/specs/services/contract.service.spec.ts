import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContractStatus } from 'src/enums/contract.enum';
import { ProposalStatus } from 'src/enums/proposal.enum';
import { UserRole } from 'src/enums/user.enum';
import { ContractService } from 'src/services/contract.service';
import { NotificationService } from 'src/services/notification.service';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockContractRepository = {
  findByPk: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
};

const mockProposalRepository = {
  findByPk: jest.fn(),
};

const mockProjectRepository = {
  findByPk: jest.fn(),
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
  startedAt: new Date(),
  completedAt: null,
  ...overrides,
});

const buildProposal = (overrides = {}) => ({
  _id: { toString: () => 'proposal-id-1' },
  projectId: 'project-id-1',
  freelancerId: 'freelancer-id-1',
  status: ProposalStatus.ACCEPTED,
  price: 500,
  ...overrides,
});

const buildProject = (overrides = {}) => ({
  _id: { toString: () => 'project-id-1' },
  clientId: 'client-id-1',
  ...overrides,
});

const buildAuthUser = (overrides: any = {}): any => ({
  _id: 'client-id-1',
  fullname: 'Test Client',
  email: 'client@test.com',
  password: 'hashed-password',
  avatar: 'https://test.com/avatar.png',
  role: UserRole.CLIENT,
  ...overrides,
});
// ── Suite ──────────────────────────────────────────────────────────────────────

describe('ContractService', () => {
  let service: ContractService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractService,
        { provide: 'IContractRepository', useValue: mockContractRepository },
        { provide: 'IProposalRepository', useValue: mockProposalRepository },
        { provide: 'IProjectRepository', useValue: mockProjectRepository },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<ContractService>(ContractService);
    jest.clearAllMocks();
  });

  // ── createContract ────────────────────────────────────────────────────────────

  describe('createContract', () => {
    it('should throw NotFoundException if proposal not found', async () => {
      mockProposalRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.createContract(buildAuthUser(), 'proposal-id-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if proposal is not accepted', async () => {
      mockProposalRepository.findByPk.mockResolvedValue(
        buildProposal({ status: ProposalStatus.PENDING }),
      );

      await expect(
        service.createContract(buildAuthUser(), 'proposal-id-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProposalRepository.findByPk.mockResolvedValue(buildProposal());
      mockProjectRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.createContract(buildAuthUser(), 'proposal-id-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if authUser is not the project client', async () => {
      mockProposalRepository.findByPk.mockResolvedValue(buildProposal());
      mockProjectRepository.findByPk.mockResolvedValue(
        buildProject({ clientId: 'other-client' }),
      );

      await expect(
        service.createContract(buildAuthUser(), 'proposal-id-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if contract already exists', async () => {
      mockProposalRepository.findByPk.mockResolvedValue(buildProposal());
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockContractRepository.findOne.mockResolvedValue(buildContract());

      await expect(
        service.createContract(buildAuthUser(), 'proposal-id-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create contract and send notifications to both parties', async () => {
      const proposal = buildProposal();
      const project = buildProject();
      const contract = buildContract();

      mockProposalRepository.findByPk.mockResolvedValue(proposal);
      mockProjectRepository.findByPk.mockResolvedValue(project);
      mockContractRepository.findOne.mockResolvedValue(null);
      mockContractRepository.create.mockResolvedValue(contract);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const result = await service.createContract(
        buildAuthUser(),
        'proposal-id-1',
      );

      expect(mockContractRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContractStatus.ACTIVE,
          projectId: proposal.projectId,
          proposalId: proposal._id.toString(),
          clientId: project.clientId,
          freelancerId: proposal.freelancerId,
        }),
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(
        2,
      );
      expect(result).toBeDefined();
    });
  });

  // ── getAllContracts ────────────────────────────────────────────────────────────

  describe('getAllContracts', () => {
    it('should return paginated contracts with hasMore flag', async () => {
      const contracts = [buildContract(), buildContract()];
      mockContractRepository.findAll.mockResolvedValue(contracts);
      mockContractRepository.count.mockResolvedValue(25);

      const result = await service.getAllContracts(1, 10);

      expect(mockContractRepository.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toBeDefined();
    });
  });

  // ── getMyContractWithUser ─────────────────────────────────────────────────────

  describe('getMyContractWithUser', () => {
    it('should throw NotFoundException if no contract found', async () => {
      mockContractRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getMyContractWithUser(buildAuthUser(), 'freelancer-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should query with clientId filter when authUser is CLIENT', async () => {
      const contract = buildContract();
      mockContractRepository.findOne.mockResolvedValue(contract);

      const result = await service.getMyContractWithUser(
        buildAuthUser({ role: UserRole.CLIENT }),
        'freelancer-id-1',
      );

      expect(mockContractRepository.findOne).toHaveBeenCalledWith({
        clientId: 'client-id-1',
        freelancerId: 'freelancer-id-1',
      });
      expect(result).toBeDefined();
    });

    it('should query with freelancerId filter when authUser is FREELANCER', async () => {
      const contract = buildContract();
      mockContractRepository.findOne.mockResolvedValue(contract);

      await service.getMyContractWithUser(
        buildAuthUser({ _id: 'freelancer-id-1', role: UserRole.FREELANCER }),
        'client-id-1',
      );

      expect(mockContractRepository.findOne).toHaveBeenCalledWith({
        clientId: 'client-id-1',
        freelancerId: 'freelancer-id-1',
      });
    });
  });

  // ── getContractById ───────────────────────────────────────────────────────────

  describe('getContractById', () => {
    it('should throw NotFoundException if contract not found', async () => {
      mockContractRepository.findByPk.mockResolvedValue(null);

      await expect(service.getContractById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return contract if found', async () => {
      mockContractRepository.findByPk.mockResolvedValue(buildContract());

      const result = await service.getContractById('contract-id-1');

      expect(result).toBeDefined();
    });
  });

  // ── deleteContract ────────────────────────────────────────────────────────────

  describe('deleteContract', () => {
    it('should throw NotFoundException if contract not found', async () => {
      mockContractRepository.findByPk.mockResolvedValue(null);

      await expect(service.deleteContract('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if contract is ACTIVE', async () => {
      mockContractRepository.findByPk.mockResolvedValue(
        buildContract({ status: ContractStatus.ACTIVE }),
      );

      await expect(service.deleteContract('contract-id-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete contract if not active', async () => {
      mockContractRepository.findByPk.mockResolvedValue(
        buildContract({ status: ContractStatus.COMPLETED }),
      );
      mockContractRepository.destroy.mockResolvedValue(true);

      const result = await service.deleteContract('contract-id-1');

      expect(mockContractRepository.destroy).toHaveBeenCalledWith({
        _id: 'contract-id-1',
      });
      expect(result).toBeDefined();
    });
  });
});
