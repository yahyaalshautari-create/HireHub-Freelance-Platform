import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from 'src/enums/project.enum';
import { UserRole } from 'src/enums/user.enum';
import { ProjectService } from 'src/services/project.service';
import { RedisHelper } from 'src/redis/redis.helper';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockProjectRepository = {
  create: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  findByClientId: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const mockProposalRepository = {
  deleteAll: jest.fn(),
};

const mockUserRepository = {
  findByPk: jest.fn(),
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
  title: 'Test Project',
  description: 'Description',
  budget: 1000,
  status: ProjectStatus.PENDING_REVIEW,
  ...overrides,
});

const buildUser = (role = UserRole.ADMIN) => ({
  _id: 'admin-id',
  role,
});

const buildAuthUser = (overrides: any = {}) => ({
  _id: 'client-id-1',
  role: UserRole.CLIENT,
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: 'IProjectRepository', useValue: mockProjectRepository },
        { provide: 'IProposalRepository', useValue: mockProposalRepository },
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: RedisHelper, useValue: mockRedisHelper },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    jest.clearAllMocks();
    // Reset redis mock defaults after clearAllMocks
    mockRedisHelper.get.mockResolvedValue(null);
    mockRedisHelper.set.mockResolvedValue(undefined);
    mockRedisHelper.del.mockResolvedValue(undefined);
  });

  // ── createProject ─────────────────────────────────────────────────────────────

  describe('createProject', () => {
    it('should create project with PENDING_REVIEW status', async () => {
      const project = buildProject();
      mockProjectRepository.create.mockResolvedValue(project);

      const result = await service.createProject('client-id-1', {
        title: 'Test',
        description: 'Desc',
        budget: 1000,
        budgetType: 'FIXED' as any,
      });

      expect(mockProjectRepository.create).toHaveBeenCalledWith(
        'client-id-1',
        expect.objectContaining({ status: ProjectStatus.PENDING_REVIEW }),
      );
      expect(mockRedisHelper.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── reviewProject ─────────────────────────────────────────────────────────────

  describe('reviewProject', () => {
    it('should throw ForbiddenException if admin not found or not admin/support', async () => {
      mockUserRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.reviewProject('admin-id', 'project-id', ProjectStatus.OPEN),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user role is CLIENT', async () => {
      mockUserRepository.findByPk.mockResolvedValue(buildUser(UserRole.CLIENT));

      await expect(
        service.reviewProject('client-id', 'project-id', ProjectStatus.OPEN),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockUserRepository.findByPk.mockResolvedValue(buildUser(UserRole.ADMIN));
      mockProjectRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.reviewProject('admin-id', 'project-id', ProjectStatus.OPEN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if project is not PENDING_REVIEW', async () => {
      mockUserRepository.findByPk.mockResolvedValue(buildUser(UserRole.ADMIN));
      mockProjectRepository.findByPk.mockResolvedValue(
        buildProject({ status: ProjectStatus.OPEN }),
      );

      await expect(
        service.reviewProject('admin-id', 'project-id', ProjectStatus.OPEN),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update project status to OPEN', async () => {
      const project = buildProject();
      const updated = buildProject({ status: ProjectStatus.OPEN });
      mockUserRepository.findByPk.mockResolvedValue(buildUser(UserRole.ADMIN));
      mockProjectRepository.findByPk.mockResolvedValue(project);
      mockProjectRepository.update.mockResolvedValue(updated);

      const result = await service.reviewProject(
        'admin-id',
        'project-id-1',
        ProjectStatus.OPEN,
      );

      expect(mockProjectRepository.update).toHaveBeenCalledWith(
        'project-id-1',
        { status: ProjectStatus.OPEN },
      );
      expect(mockRedisHelper.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── getAllProjects ─────────────────────────────────────────────────────────────

  describe('getAllProjects', () => {
    it('should return cached projects from redis if available', async () => {
      const cached = {
        projects: [buildProject()],
        total: 1,
        page: 1,
        limit: 10,
        hasMore: false,
      };
      mockRedisHelper.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getAllProjects(1, 10);

      expect(result).toBeDefined();
      expect(mockProjectRepository.findAll).not.toHaveBeenCalled();
    });

    it('should return paginated projects from DB and cache them', async () => {
      mockRedisHelper.get.mockResolvedValue(null);
      mockProjectRepository.findAll.mockResolvedValue([buildProject()]);
      mockProjectRepository.count.mockResolvedValue(15);

      const result = await service.getAllProjects(1, 10);

      expect(result).toBeDefined();
      expect(mockProjectRepository.findAll).toHaveBeenCalledWith(1, 10);
      expect(mockRedisHelper.set).toHaveBeenCalled();
    });
  });

  // ── getProjectById ────────────────────────────────────────────────────────────

  describe('getProjectById', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockRedisHelper.get.mockResolvedValue(null);
      mockProjectRepository.findByPk.mockResolvedValue(null);

      await expect(service.getProjectById('project-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return cached project from redis if available', async () => {
      const project = buildProject();
      mockRedisHelper.get.mockResolvedValue(JSON.stringify(project));

      const result = await service.getProjectById('project-id-1');

      expect(result).toBeDefined();
      expect(mockProjectRepository.findByPk).not.toHaveBeenCalled();
    });

    it('should return project from DB and cache it', async () => {
      mockRedisHelper.get.mockResolvedValue(null);
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());

      const result = await service.getProjectById('project-id-1');

      expect(result).toBeDefined();
      expect(mockRedisHelper.set).toHaveBeenCalled();
    });
  });

  // ── getProjectByClient ────────────────────────────────────────────────────────

  describe('getProjectByClient', () => {
    it('should return cached projects from redis if available', async () => {
      const projects = [buildProject()];
      mockRedisHelper.get.mockResolvedValue(JSON.stringify(projects));

      const result = await service.getProjectByClient('client-id-1');

      expect(result).toBeDefined();
      expect(mockProjectRepository.findByClientId).not.toHaveBeenCalled();
    });

    it('should return all projects for a client from DB and cache them', async () => {
      mockRedisHelper.get.mockResolvedValue(null);
      mockProjectRepository.findByClientId.mockResolvedValue([buildProject()]);

      const result = await service.getProjectByClient('client-id-1');

      expect(mockProjectRepository.findByClientId).toHaveBeenCalledWith(
        'client-id-1',
      );
      expect(mockRedisHelper.set).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── deleteProject ─────────────────────────────────────────────────────────────

  describe('deleteProject', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.deleteProject(buildAuthUser(), 'project-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not the owner', async () => {
      mockProjectRepository.findByPk.mockResolvedValue(
        buildProject({ clientId: 'other-client' }),
      );

      await expect(
        service.deleteProject(
          buildAuthUser({ _id: 'wrong-user' }),
          'project-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should delete project if owner and clear redis cache', async () => {
      mockProjectRepository.findByPk.mockResolvedValue(buildProject());
      mockProjectRepository.destroy.mockResolvedValue(true);

      const result = await service.deleteProject(
        buildAuthUser(),
        'project-id-1',
      );

      expect(mockProposalRepository.deleteAll).toHaveBeenCalledWith({
        projectId: 'project-id-1',
      });
      expect(mockProjectRepository.destroy).toHaveBeenCalledWith(
        'project-id-1',
      );
      expect(mockRedisHelper.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
