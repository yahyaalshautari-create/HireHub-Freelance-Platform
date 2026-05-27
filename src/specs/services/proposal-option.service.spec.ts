import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProposalStatus } from 'src/enums/proposal.enum';
import { UserRole } from 'src/enums/user.enum';
import { NotificationType } from 'src/enums/notification.enum';
import { ProposalHelper } from 'src/libs/proposal.helper';
import { ProposalOptionService } from 'src/services/proposal-option.service';
import { NotificationService } from 'src/services/notification.service';
import { RedisHelper } from 'src/redis/redis.helper';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockProposalOptionRepository = {
  findByPk: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
};

const mockProjectRepository = {
  findByPk: jest.fn(),
  findByClientId: jest.fn(),
};

const mockUserRepository = {
  findByPk: jest.fn(),
  update: jest.fn(),
};

const mockProposalHelper = {
  acceptProposalFlow: jest.fn(),
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

const buildProposal = (overrides = {}) => ({
  _id: { toString: () => 'proposal-id-1' },
  projectId: { toString: () => 'project-id-1' },
  freelancerId: 'freelancer-id-1',
  price: 500,
  durationDays: 10,
  pendingPrice: null,
  pendingDurationDays: null,
  isUpdatePending: false,
  status: ProposalStatus.PENDING,
  ...overrides,
});

const buildProject = (overrides = {}) => ({
  _id: { toString: () => 'project-id-1' },
  clientId: 'client-id-1',
  ...overrides,
});

const buildUser = (overrides = {}) => ({
  _id: 'client-id-1',
  balance: 1000,
  frozenBalance: 0,
  ...overrides,
});

const buildAuthUser = (overrides: any = {}) => ({
  _id: 'client-id-1',
  role: UserRole.CLIENT,
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('ProposalOptionService', () => {
  let service: ProposalOptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalOptionService,
        {
          provide: 'IProposalOptionRepository',
          useValue: mockProposalOptionRepository,
        },
        { provide: 'IProjectRepository', useValue: mockProjectRepository },
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: ProposalHelper, useValue: mockProposalHelper },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: RedisHelper, useValue: mockRedisHelper },
      ],
    }).compile();

    service = module.get<ProposalOptionService>(ProposalOptionService);
    jest.clearAllMocks();
    // Reset redis mock defaults after clearAllMocks
    mockRedisHelper.get.mockResolvedValue(null);
    mockRedisHelper.set.mockResolvedValue(undefined);
    mockRedisHelper.del.mockResolvedValue(undefined);
  });

  // ── updateProposal ────────────────────────────────────────────────────────────

  describe('updateProposal', () => {
    const dto = {
      coverLetter: 'test cover letter',
      price: 600,
      durationDays: 15,
    };

    it('should throw NotFoundException if proposal not found', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.updateProposal(
          buildAuthUser({ _id: 'freelancer-id-1', role: UserRole.FREELANCER }),
          'proposal-id',
          dto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not proposal owner', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(buildProposal());

      await expect(
        service.updateProposal(
          buildAuthUser({ _id: 'other-freelancer', role: UserRole.FREELANCER }),
          'proposal-id',
          dto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if update is already pending', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(
        buildProposal({ isUpdatePending: true }),
      );

      await expect(
        service.updateProposal(
          buildAuthUser({ _id: 'freelancer-id-1', role: UserRole.FREELANCER }),
          'proposal-id',
          dto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(buildProposal());
      mockProjectRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.updateProposal(
          buildAuthUser({ _id: 'freelancer-id-1', role: UserRole.FREELANCER }),
          'proposal-id',
          dto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set pending price/duration and return success', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(buildProposal());
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockProposalOptionRepository.update.mockResolvedValue(true);

      const result = await service.updateProposal(
        buildAuthUser({ _id: 'freelancer-id-1', role: UserRole.FREELANCER }),
        'proposal-id',
        dto,
      );

      expect(mockProposalOptionRepository.update).toHaveBeenCalledWith(
        { pendingPrice: 600, pendingDurationDays: 15, isUpdatePending: true },
        { _id: 'proposal-id' },
      );
      expect(mockRedisHelper.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── getPendingProposalUpdates ─────────────────────────────────────────────────

  describe('getPendingProposalUpdates', () => {
    it('should return cached proposals from redis if available', async () => {
      const cached = [buildProposal()];
      mockRedisHelper.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getPendingProposalUpdates(buildAuthUser());

      expect(result).toBeDefined();
      expect(mockProjectRepository.findByClientId).not.toHaveBeenCalled();
    });

    it('should return proposals for projects owned by authUser and cache them', async () => {
      mockRedisHelper.get.mockResolvedValue(null);
      const projects = [buildProject()];
      mockProjectRepository.findByClientId.mockResolvedValue(projects);
      mockProposalOptionRepository.findAll.mockResolvedValue([buildProposal()]);

      const result = await service.getPendingProposalUpdates(buildAuthUser());

      expect(mockProjectRepository.findByClientId).toHaveBeenCalledWith(
        'client-id-1',
      );
      expect(mockProposalOptionRepository.findAll).toHaveBeenCalledWith([
        'project-id-1',
      ]);
      expect(mockRedisHelper.set).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── approveProposal ───────────────────────────────────────────────────────────

  describe('approveProposal', () => {
    it('should throw NotFoundException if proposal not found', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.approveProposal(buildAuthUser(), 'proposal-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(buildProposal());
      mockProjectRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.approveProposal(buildAuthUser(), 'proposal-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not project client', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(buildProposal());
      mockProjectRepository.findByPk.mockResolvedValue(
        buildProject({ clientId: 'other-client' }),
      );

      await expect(
        service.approveProposal(buildAuthUser(), 'proposal-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should apply pending update and send notification when isUpdatePending is true', async () => {
      const proposal = buildProposal({
        isUpdatePending: true,
        pendingPrice: 800,
        pendingDurationDays: 20,
      });
      mockProposalOptionRepository.findByPk.mockResolvedValue(proposal);
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockProposalOptionRepository.update.mockResolvedValue(true);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const result = await service.approveProposal(
        buildAuthUser(),
        'proposal-id',
      );

      expect(mockProposalOptionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 800,
          durationDays: 20,
          isUpdatePending: false,
        }),
        { _id: 'proposal-id' },
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.APPROVED_PROPOSAL }),
      );
      expect(mockRedisHelper.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should only send notification when no pending update', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(
        buildProposal({ isUpdatePending: false }),
      );
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const result = await service.approveProposal(
        buildAuthUser(),
        'proposal-id',
      );

      expect(mockProposalOptionRepository.update).not.toHaveBeenCalled();
      expect(mockNotificationService.createNotification).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── updateProposalStatus ──────────────────────────────────────────────────────

  describe('updateProposalStatus', () => {
    it('should throw NotFoundException if proposal not found', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.updateProposalStatus(
          buildAuthUser(),
          'proposal-id',
          ProposalStatus.ACCEPTED,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(buildProposal());
      mockProjectRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.updateProposalStatus(
          buildAuthUser(),
          'proposal-id',
          ProposalStatus.ACCEPTED,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not the project client', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(buildProposal());
      mockProjectRepository.findByPk.mockResolvedValue(
        buildProject({ clientId: 'other-client' }),
      );

      await expect(
        service.updateProposalStatus(
          buildAuthUser({ _id: 'wrong-user' }),
          'proposal-id',
          ProposalStatus.ACCEPTED,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if proposal status is not PENDING', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(
        buildProposal({ status: ProposalStatus.ACCEPTED }),
      );
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());

      await expect(
        service.updateProposalStatus(
          buildAuthUser(),
          'proposal-id',
          ProposalStatus.REJECTED,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if client has insufficient balance for ACCEPTED', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(
        buildProposal({ price: 1000 }),
      );
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockUserRepository.findByPk.mockResolvedValue(
        buildUser({ balance: 100 }),
      );

      await expect(
        service.updateProposalStatus(
          buildAuthUser(),
          'proposal-id',
          ProposalStatus.ACCEPTED,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept proposal: deduct balance, freeze, run flow, update status', async () => {
      const proposal = buildProposal();
      const project = buildProject();
      const client = buildUser({ balance: 1000, frozenBalance: 0 });

      mockProposalOptionRepository.findByPk.mockResolvedValue(proposal);
      mockProjectRepository.findByPk.mockResolvedValue(project);
      mockUserRepository.findByPk.mockResolvedValue(client);
      mockUserRepository.update.mockResolvedValue(true);
      mockProposalHelper.acceptProposalFlow.mockResolvedValue(undefined);
      mockProposalOptionRepository.update.mockResolvedValue(true);

      const result = await service.updateProposalStatus(
        buildAuthUser(),
        'proposal-id',
        ProposalStatus.ACCEPTED,
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { balance: 500, frozenBalance: 500 },
        { _id: 'client-id-1' },
      );
      expect(mockProposalHelper.acceptProposalFlow).toHaveBeenCalledWith(
        proposal,
        project,
      );
      expect(mockProposalOptionRepository.update).toHaveBeenCalledWith(
        { status: ProposalStatus.ACCEPTED },
        { _id: 'proposal-id' },
      );
      expect(mockRedisHelper.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should reject proposal without balance deduction', async () => {
      mockProposalOptionRepository.findByPk.mockResolvedValue(buildProposal());
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockProposalOptionRepository.update.mockResolvedValue(true);

      const result = await service.updateProposalStatus(
        buildAuthUser(),
        'proposal-id',
        ProposalStatus.REJECTED,
      );

      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(mockProposalHelper.acceptProposalFlow).not.toHaveBeenCalled();
      expect(mockRedisHelper.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
