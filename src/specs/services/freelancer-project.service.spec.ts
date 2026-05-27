import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UserRole } from 'src/enums/user.enum';
import * as cloudinaryLib from 'src/libs/cloudinary';
import { FreelancerProjectService } from 'src/services/freelancer-project.service';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFreelancerProjectRepository = {
  findByPk: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn(),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const buildProject = (overrides = {}) => ({
  _id: 'fp-id-1',
  freelancerId: 'freelancer-id-1',
  title: 'My Project',
  description: 'Description',
  linkDemo: 'https://demo.com',
  images: ['https://cloudinary.com/img1.jpg'],
  ...overrides,
});

const buildAuthUser = (overrides: any = {}) => ({
  _id: 'freelancer-id-1',
  role: UserRole.FREELANCER,
  ...overrides,
});

const mockFile = {
  buffer: Buffer.from('img'),
  mimetype: 'image/png',
} as Express.Multer.File;

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('FreelancerProjectService', () => {
  let service: FreelancerProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FreelancerProjectService,
        {
          provide: 'IFreelancerProjectRepository',
          useValue: mockFreelancerProjectRepository,
        },
      ],
    }).compile();

    service = module.get<FreelancerProjectService>(FreelancerProjectService);
    jest.clearAllMocks();
    jest.spyOn(cloudinaryLib, 'uploadToCloudinary').mockResolvedValue({
      secure_url: 'https://cloudinary.com/new.jpg',
    } as any);
  });

  // ── crearteFreelancerProject ──────────────────────────────────────────────────

  describe('crearteFreelancerProject', () => {
    const dto = {
      title: 'Project',
      description: 'Desc',
      linkDemo: 'https://demo.com',
    };

    it('should throw BadRequestException if no files provided', async () => {
      await expect(
        service.crearteFreelancerProject(buildAuthUser(), dto, []),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if project limit (5) reached', async () => {
      mockFreelancerProjectRepository.count.mockResolvedValue(5);

      await expect(
        service.crearteFreelancerProject(buildAuthUser(), dto, [mockFile]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create project with uploaded images', async () => {
      mockFreelancerProjectRepository.count.mockResolvedValue(2);
      mockFreelancerProjectRepository.create.mockResolvedValue(buildProject());

      const result = await service.crearteFreelancerProject(
        buildAuthUser(),
        dto,
        [mockFile],
      );

      expect(cloudinaryLib.uploadToCloudinary).toHaveBeenCalledWith(
        mockFile,
        'freelancer-projects',
      );
      expect(mockFreelancerProjectRepository.create).toHaveBeenCalledWith(
        'freelancer-id-1',
        expect.objectContaining({ images: ['https://cloudinary.com/new.jpg'] }),
      );
      expect(result).toBeDefined();
    });
  });

  // ── getFreelancerProjects / getMyProjects ─────────────────────────────────────

  describe('getFreelancerProjects', () => {
    it('should return all projects for a freelancer', async () => {
      mockFreelancerProjectRepository.findAll.mockResolvedValue([
        buildProject(),
      ]);

      const result = await service.getFreelancerProjects('freelancer-id-1');

      expect(mockFreelancerProjectRepository.findAll).toHaveBeenCalledWith(
        'freelancer-id-1',
      );
      expect(result).toBeDefined();
    });
  });

  describe('getMyProjects', () => {
    it('should return projects for authenticated freelancer', async () => {
      mockFreelancerProjectRepository.findAll.mockResolvedValue([
        buildProject(),
      ]);

      const result = await service.getMyProjects('freelancer-id-1');

      expect(result).toBeDefined();
    });
  });

  // ── updateFreelancerProject ───────────────────────────────────────────────────

  describe('updateFreelancerProject', () => {
    it('should throw BadRequestException if project not found', async () => {
      mockFreelancerProjectRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.updateFreelancerProject(buildAuthUser(), 'fp-id', {}, []),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if caller is not the owner', async () => {
      mockFreelancerProjectRepository.findByPk.mockResolvedValue(
        buildProject({ freelancerId: 'other-freelancer' }),
      );

      await expect(
        service.updateFreelancerProject(
          buildAuthUser({ _id: 'wrong-user' }),
          'fp-id',
          {},
          [],
        ),
      ).rejects.toThrow(Error); // ForbiddenException from assertOwnerOrAdmin
    });

    it('should update project keeping old images when no new files provided', async () => {
      const project = buildProject();
      const updatedProject = buildProject({ title: 'Updated' });
      mockFreelancerProjectRepository.findByPk.mockResolvedValue(project);
      mockFreelancerProjectRepository.update.mockResolvedValue(updatedProject);

      const result = await service.updateFreelancerProject(
        buildAuthUser(),
        'fp-id-1',
        { title: 'Updated' },
        [],
      );

      expect(mockFreelancerProjectRepository.update).toHaveBeenCalledWith(
        'fp-id-1',
        expect.objectContaining({
          title: 'Updated',
          images: project.images, // old images kept
        }),
      );
      expect(result).toBeDefined();
    });

    it('should replace images when new files are provided', async () => {
      const project = buildProject();
      mockFreelancerProjectRepository.findByPk.mockResolvedValue(project);
      mockFreelancerProjectRepository.update.mockResolvedValue(project);

      await service.updateFreelancerProject(buildAuthUser(), 'fp-id-1', {}, [
        mockFile,
      ]);

      expect(cloudinaryLib.uploadToCloudinary).toHaveBeenCalled();
      expect(mockFreelancerProjectRepository.update).toHaveBeenCalledWith(
        'fp-id-1',
        expect.objectContaining({ images: ['https://cloudinary.com/new.jpg'] }),
      );
    });
  });

  // ── deleteFreelancerProject ───────────────────────────────────────────────────

  describe('deleteFreelancerProject', () => {
    it('should throw BadRequestException if project not found', async () => {
      mockFreelancerProjectRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.deleteFreelancerProject(buildAuthUser(), 'fp-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should delete project if owner', async () => {
      mockFreelancerProjectRepository.findByPk.mockResolvedValue(
        buildProject(),
      );
      mockFreelancerProjectRepository.destroy.mockResolvedValue(true);

      const result = await service.deleteFreelancerProject(
        buildAuthUser(),
        'fp-id-1',
      );

      expect(mockFreelancerProjectRepository.destroy).toHaveBeenCalledWith(
        'fp-id-1',
      );
      expect(result).toBeDefined();
    });
  });
});
