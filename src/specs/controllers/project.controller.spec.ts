import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from 'src/services/project.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ClientGuard } from 'src/guards/client.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { CreateProjectDto } from 'src/dtos/project/create-project.dto';
import { ProjectStatus } from 'src/enums/project.enum';
import type { RequestWithUser } from 'src/types/express';
import { ProjectController } from 'src/controllers/project.controller';

describe('ProjectController', () => {
  let controller: ProjectController;
  let projectService: jest.Mocked<ProjectService>;

  const mockProjectService: jest.Mocked<Partial<any>> = {
    createProject: jest.fn(),
    reviewProject: jest.fn(),
    getAllProjects: jest.fn(),
    getProjectById: jest.fn(),
    getProjectByClient: jest.fn(),
    deleteProject: jest.fn(),
  };

  const mockUser = { _id: 'user-id-123', email: 'client@example.com' };
  const mockRequest = { user: mockUser } as unknown as RequestWithUser;
  const projectId = 'project-id-abc';
  const clientId = 'client-id-xyz';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [{ provide: ProjectService, useValue: mockProjectService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ClientGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<ProjectController>(ProjectController);
    projectService = module.get(ProjectService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── createProject ────────────────────────────────────────────────────────
  describe('createProject()', () => {
    const createProjectDto: CreateProjectDto = {
      title: 'New Project',
      description: 'Project description',
      budget: 1000,
    } as CreateProjectDto;

    it('should call projectService.createProject with user._id and dto', async () => {
      const expectedResult = { _id: projectId };
      mockProjectService.createProject.mockResolvedValue(expectedResult as any);

      const result = await controller.createProject(
        mockRequest,
        createProjectDto,
      );

      expect(projectService.createProject).toHaveBeenCalledTimes(1);
      expect(projectService.createProject).toHaveBeenCalledWith(
        mockUser._id,
        createProjectDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from createProject', async () => {
      mockProjectService.createProject.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(
        controller.createProject(mockRequest, createProjectDto),
      ).rejects.toThrow('Creation failed');
    });
  });

  // ─── reviewProject ────────────────────────────────────────────────────────
  describe('reviewProject()', () => {
    it('should call projectService.reviewProject with user._id, projectId and OPEN status', async () => {
      const expectedResult = { _id: projectId, status: ProjectStatus.OPEN };
      mockProjectService.reviewProject.mockResolvedValue(expectedResult as any);

      const result = await controller.reviewProject(
        mockRequest,
        projectId,
        ProjectStatus.OPEN,
      );

      expect(projectService.reviewProject).toHaveBeenCalledTimes(1);
      expect(projectService.reviewProject).toHaveBeenCalledWith(
        mockUser._id,
        projectId,
        ProjectStatus.OPEN,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should call projectService.reviewProject with REJECTED status', async () => {
      mockProjectService.reviewProject.mockResolvedValue({
        status: ProjectStatus.REJECTED,
      } as any);

      await controller.reviewProject(
        mockRequest,
        projectId,
        ProjectStatus.REJECTED,
      );

      expect(projectService.reviewProject).toHaveBeenCalledWith(
        mockUser._id,
        projectId,
        ProjectStatus.REJECTED,
      );
    });

    it('should propagate errors from reviewProject', async () => {
      mockProjectService.reviewProject.mockRejectedValue(
        new Error('Review failed'),
      );

      await expect(
        controller.reviewProject(mockRequest, projectId, ProjectStatus.OPEN),
      ).rejects.toThrow('Review failed');
    });
  });

  // ─── getAllProjects ───────────────────────────────────────────────────────
  describe('getAllProjects()', () => {
    it('should call projectService.getAllProjects with default page=1 and limit=10', async () => {
      const expectedResult = { data: [], total: 0 };
      mockProjectService.getAllProjects.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getAllProjects();

      expect(projectService.getAllProjects).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(expectedResult);
    });

    it('should forward custom page and limit', async () => {
      mockProjectService.getAllProjects.mockResolvedValue({ data: [] } as any);

      await controller.getAllProjects(3, 15);

      expect(projectService.getAllProjects).toHaveBeenCalledWith(3, 15);
    });
  });

  // ─── getProjectById ───────────────────────────────────────────────────────
  describe('getProjectById()', () => {
    it('should call projectService.getProjectById with projectId', async () => {
      const expectedResult = { _id: projectId, title: 'New Project' };
      mockProjectService.getProjectById.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getProjectById(projectId);

      expect(projectService.getProjectById).toHaveBeenCalledTimes(1);
      expect(projectService.getProjectById).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getProjectById', async () => {
      mockProjectService.getProjectById.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(controller.getProjectById(projectId)).rejects.toThrow(
        'Not found',
      );
    });
  });

  // ─── getProjectByClient ───────────────────────────────────────────────────
  describe('getProjectByClient()', () => {
    it('should call projectService.getProjectByClient with clientId', async () => {
      const expectedResult = [{ _id: projectId }];
      mockProjectService.getProjectByClient.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getProjectByClient(clientId);

      expect(projectService.getProjectByClient).toHaveBeenCalledTimes(1);
      expect(projectService.getProjectByClient).toHaveBeenCalledWith(clientId);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getProjectByClient', async () => {
      mockProjectService.getProjectByClient.mockRejectedValue(
        new Error('Client not found'),
      );

      await expect(controller.getProjectByClient(clientId)).rejects.toThrow(
        'Client not found',
      );
    });
  });

  // ─── deleteProject ────────────────────────────────────────────────────────
  describe('deleteProject()', () => {
    it('should call projectService.deleteProject with user and projectId', async () => {
      const expectedResult = { message: 'Project deleted' };
      mockProjectService.deleteProject.mockResolvedValue(expectedResult as any);

      const result = await controller.deleteProject(mockRequest, projectId);

      expect(projectService.deleteProject).toHaveBeenCalledTimes(1);
      expect(projectService.deleteProject).toHaveBeenCalledWith(
        mockUser,
        projectId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from deleteProject', async () => {
      mockProjectService.deleteProject.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        controller.deleteProject(mockRequest, projectId),
      ).rejects.toThrow('Delete failed');
    });
  });
});
