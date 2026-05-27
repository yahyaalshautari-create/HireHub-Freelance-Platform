import { Test, TestingModule } from '@nestjs/testing';
import { FreelancerProjectService } from 'src/services/freelancer-project.service';
import { FreelancerGuard } from 'src/guards/freelancer.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { CreateFreelancerProjectDto } from 'src/dtos/freelancer-project/create-freelancer-project.dto';
import type { RequestWithUser } from 'src/types/express';
import type { AuthUser } from 'src/interfaces/auth-user.interface';
import { FreelancerProjectController } from 'src/controllers/freelancer-project.controller';

describe('FreelancerProjectController', () => {
  let controller: FreelancerProjectController;
  let freelancerProjectService: jest.Mocked<FreelancerProjectService>;

  const mockFreelancerProjectService: jest.Mocked<Partial<any>> = {
    crearteFreelancerProject: jest.fn(),
    getFreelancerProjects: jest.fn(),
    getMyProjects: jest.fn(),
    updateFreelancerProject: jest.fn(),
    deleteFreelancerProject: jest.fn(),
  };

  const mockUser = {
    _id: 'user-id-123',
    email: 'freelancer@example.com',
  } as AuthUser;

  const mockRequest = { user: mockUser } as unknown as RequestWithUser;
  const freelancerId = 'freelancer-id-abc';
  const projectId = 'project-id-xyz';

  const mockFiles: Express.Multer.File[] = [
    {
      fieldname: 'images',
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from(''),
    } as Express.Multer.File,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FreelancerProjectController],
      providers: [
        {
          provide: FreelancerProjectService,
          useValue: mockFreelancerProjectService,
        },
      ],
    })
      .overrideGuard(FreelancerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<FreelancerProjectController>(
      FreelancerProjectController,
    );
    freelancerProjectService = module.get(FreelancerProjectService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── createFreelancerProject ──────────────────────────────────────────────
  describe('createFreelancerProject()', () => {
    const createDto: CreateFreelancerProjectDto = {
      title: 'My Project',
      description: 'Project description',
    } as CreateFreelancerProjectDto;

    it('should call service.crearteFreelancerProject with authUser, dto and files', async () => {
      const expectedResult = { _id: projectId };
      mockFreelancerProjectService.crearteFreelancerProject.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.createFreelancerProject(
        mockRequest,
        createDto,
        mockFiles,
      );

      expect(
        freelancerProjectService.crearteFreelancerProject,
      ).toHaveBeenCalledTimes(1);
      expect(
        freelancerProjectService.crearteFreelancerProject,
      ).toHaveBeenCalledWith(mockUser, createDto, mockFiles);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from crearteFreelancerProject', async () => {
      mockFreelancerProjectService.crearteFreelancerProject.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(
        controller.createFreelancerProject(mockRequest, createDto, mockFiles),
      ).rejects.toThrow('Creation failed');
    });
  });

  // ─── getFreelancerProjects ────────────────────────────────────────────────
  describe('getFreelancerProjects()', () => {
    it('should call service.getFreelancerProjects with freelancerId', async () => {
      const expectedResult = [{ _id: projectId }];
      mockFreelancerProjectService.getFreelancerProjects.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getFreelancerProjects(freelancerId);

      expect(
        freelancerProjectService.getFreelancerProjects,
      ).toHaveBeenCalledTimes(1);
      expect(
        freelancerProjectService.getFreelancerProjects,
      ).toHaveBeenCalledWith(freelancerId);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getFreelancerProjects', async () => {
      mockFreelancerProjectService.getFreelancerProjects.mockRejectedValue(
        new Error('Freelancer not found'),
      );

      await expect(
        controller.getFreelancerProjects(freelancerId),
      ).rejects.toThrow('Freelancer not found');
    });
  });

  // ─── getMyProjects ────────────────────────────────────────────────────────
  describe('getMyProjects()', () => {
    it('should call service.getMyProjects with req.user._id', async () => {
      const expectedResult = [{ _id: projectId }];
      mockFreelancerProjectService.getMyProjects.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getMyProjects(mockRequest);

      expect(freelancerProjectService.getMyProjects).toHaveBeenCalledTimes(1);
      expect(freelancerProjectService.getMyProjects).toHaveBeenCalledWith(
        mockUser._id,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  // ─── updateFreelancerProject ──────────────────────────────────────────────
  describe('updateFreelancerProject()', () => {
    const updateDto: Partial<CreateFreelancerProjectDto> = {
      title: 'Updated Title',
    };

    it('should call service.updateFreelancerProject with correct args', async () => {
      const expectedResult = { _id: projectId, title: 'Updated Title' };
      mockFreelancerProjectService.updateFreelancerProject.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.updateFreelancerProject(
        mockRequest,
        projectId,
        updateDto,
        mockFiles,
      );

      expect(
        freelancerProjectService.updateFreelancerProject,
      ).toHaveBeenCalledTimes(1);
      expect(
        freelancerProjectService.updateFreelancerProject,
      ).toHaveBeenCalledWith(mockUser, projectId, updateDto, mockFiles);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from updateFreelancerProject', async () => {
      mockFreelancerProjectService.updateFreelancerProject.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        controller.updateFreelancerProject(
          mockRequest,
          projectId,
          updateDto,
          mockFiles,
        ),
      ).rejects.toThrow('Update failed');
    });
  });

  // ─── deleteFreelancerProject ──────────────────────────────────────────────
  describe('deleteFreelancerProject()', () => {
    it('should call service.deleteFreelancerProject with user and projectId', async () => {
      const expectedResult = { message: 'Project deleted' };
      mockFreelancerProjectService.deleteFreelancerProject.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.deleteFreelancerProject(
        mockRequest,
        projectId,
      );

      expect(
        freelancerProjectService.deleteFreelancerProject,
      ).toHaveBeenCalledTimes(1);
      expect(
        freelancerProjectService.deleteFreelancerProject,
      ).toHaveBeenCalledWith(mockUser, projectId);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from deleteFreelancerProject', async () => {
      mockFreelancerProjectService.deleteFreelancerProject.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        controller.deleteFreelancerProject(mockRequest, projectId),
      ).rejects.toThrow('Delete failed');
    });
  });
});
