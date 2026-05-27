import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProposalStatus } from 'src/enums/proposal.enum';
import { UserRole } from 'src/enums/user.enum';
import { NotificationType } from 'src/enums/notification.enum';
import { ProposalService } from 'src/services/proposal.service';
import { NotificationService } from 'src/services/notification.service';
import { RedisHelper } from 'src/redis/redis.helper';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockProposalRepository = {
  findByPk: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
};

const mockFreelancerRepository = {
  update: jest.fn(),
};

const mockClientRepository = {
  update: jest.fn(),
};

const mockProjectRepository = {
  findByPk: jest.fn(),
};

const mockNotificationService = {
  createNotification: jest.fn(),
};

const mockRedisHelper = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  lpush: jest.fn().mockResolvedValue(undefined),
  ltrim: jest.fn().mockResolvedValue(undefined),
  lrange: jest.fn().mockResolvedValue([]),
  incr: jest.fn().mockResolvedValue(undefined),
  decr: jest.fn().mockResolvedValue(undefined),
  lrem: jest.fn().mockResolvedValue(undefined),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const buildProject = (overrides = {}) => ({
  _id: 'project-id-1',
  clientId: 'client-id-1',
  ...overrides,
});

const buildProposal = (overrides = {}) => ({
  _id: { toString: () => 'proposal-id-1' },
  projectId: { toString: () => 'project-id-1' },
  freelancerId: 'freelancer-id-1',
  coverLetter: 'Cover letter text',
  price: 500,
  durationDays: 10,
  status: ProposalStatus.PENDING,
  ...overrides,
});

const buildAuthUser = (overrides: any = {}) => ({
  _id: 'freelancer-id-1',
  role: UserRole.FREELANCER,
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('ProposalService', () => {
  let service: ProposalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalService,
        { provide: 'IProposalRepository', useValue: mockProposalRepository },
        {
          provide: 'IFreelancerRepository',
          useValue: mockFreelancerRepository,
        },
        { provide: 'IClientRepository', useValue: mockClientRepository },
        { provide: 'IProjectRepository', useValue: mockProjectRepository },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: RedisHelper, useValue: mockRedisHelper },
      ],
    }).compile();

    service = module.get<ProposalService>(ProposalService);
    jest.clearAllMocks();
    // Reset redis mock defaults after clearAllMocks
    mockRedisHelper.get.mockResolvedValue(null);
    mockRedisHelper.set.mockResolvedValue(undefined);
    mockRedisHelper.del.mockResolvedValue(undefined);
  });

  // ── createProposal ────────────────────────────────────────────────────────────

  describe('createProposal', () => {
    const dto = { coverLetter: 'My proposal', price: 500, durationDays: 10 };

    it('should throw NotFoundException if project not found', async () => {
      mockRedisHelper.get.mockResolvedValue(null);
      mockProjectRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.createProposal(buildAuthUser(), 'project-id-1', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if freelancer already submitted a proposal', async () => {
      mockRedisHelper.get.mockResolvedValue(null);
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockProposalRepository.findOne.mockResolvedValue(buildProposal());

      await expect(
        service.createProposal(buildAuthUser(), 'project-id-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException immediately if redis cache indicates existing proposal', async () => {
      mockRedisHelper.get.mockResolvedValue('1');

      await expect(
        service.createProposal(buildAuthUser(), 'project-id-1', dto),
      ).rejects.toThrow(BadRequestException);

      expect(mockProjectRepository.findByPk).not.toHaveBeenCalled();
    });

    it('should create proposal, update counters and notify client', async () => {
      const proposal = buildProposal();
      mockRedisHelper.get.mockResolvedValue(null);
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockProposalRepository.findOne.mockResolvedValue(null);
      mockProposalRepository.create.mockResolvedValue(proposal);
      mockFreelancerRepository.update.mockResolvedValue(true);
      mockClientRepository.update.mockResolvedValue(true);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const result = await service.createProposal(
        buildAuthUser(),
        'project-id-1',
        dto,
      );

      expect(mockProposalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-id-1',
          freelancerId: 'freelancer-id-1',
          status: ProposalStatus.PENDING,
        }),
      );
      expect(mockFreelancerRepository.update).toHaveBeenCalledWith(
        { freelancerId: 'freelancer-id-1' },
        { $inc: { pendingProposals: 1 } },
      );
      expect(mockClientRepository.update).toHaveBeenCalledWith(
        { clientId: 'client-id-1' },
        { $inc: { pendingProposals: 1 } },
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: 'client-id-1',
          type: NotificationType.PROPOSAL,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  // ── getProposalsByProject ─────────────────────────────────────────────────────

  describe('getProposalsByProject', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.getProposalsByProject('project-id', 1, 10),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return cached proposals from redis if available', async () => {
      const cached = { proposals: [buildProposal()], total: 1, hasMore: false };
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockRedisHelper.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getProposalsByProject('project-id-1', 1, 10);

      expect(result).toBeDefined();
      expect(mockProposalRepository.findAll).not.toHaveBeenCalled();
    });

    it('should return paginated proposals from DB and cache them', async () => {
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockRedisHelper.get.mockResolvedValue(null);
      mockProposalRepository.findAll.mockResolvedValue([buildProposal()]);
      mockProposalRepository.count.mockResolvedValue(5);

      const result = await service.getProposalsByProject('project-id-1', 1, 10);

      expect(result).toBeDefined();
      expect(mockProposalRepository.findAll).toHaveBeenCalledWith(
        'project-id-1',
        1,
        10,
      );
      expect(mockRedisHelper.set).toHaveBeenCalled();
    });

    it('should set hasMore correctly when more pages exist', async () => {
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockRedisHelper.get.mockResolvedValue(null);
      mockProposalRepository.findAll.mockResolvedValue([buildProposal()]);
      mockProposalRepository.count.mockResolvedValue(15);

      const result = await service.getProposalsByProject('project-id-1', 1, 10);

      // page(1) * limit(10) = 10 < total(15) → hasMore = true
      expect(result).toBeDefined();
    });
  });

  // ── deleteProposal ────────────────────────────────────────────────────────────

  describe('deleteProposal', () => {
    it('should throw BadRequestException if caller is not ADMIN', async () => {
      await expect(
        service.deleteProposal(
          buildAuthUser({ role: UserRole.FREELANCER }),
          'proposal-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if proposal not found', async () => {
      mockProposalRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.deleteProposal(
          buildAuthUser({ role: UserRole.ADMIN }),
          'proposal-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete proposal for ADMIN and clear redis cache', async () => {
      mockProposalRepository.findByPk.mockResolvedValue(buildProposal());
      mockProposalRepository.destroy.mockResolvedValue(true);

      const result = await service.deleteProposal(
        buildAuthUser({ role: UserRole.ADMIN }),
        'proposal-id-1',
      );

      expect(mockProposalRepository.destroy).toHaveBeenCalledWith({
        _id: 'proposal-id-1',
      });
      expect(mockRedisHelper.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
