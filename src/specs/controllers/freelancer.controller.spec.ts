import { Test, TestingModule } from '@nestjs/testing';
import { FreelancerService } from 'src/services/freelancer.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { FreelancerGuard } from 'src/guards/freelancer.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { UpdateFreelancerDto } from 'src/dtos/freelancer/update-freelancer.dto';
import type { RequestWithUser } from 'src/types/express';
import { FreelancerController } from 'src/controllers/freelancer.controller';

describe('FreelancerController', () => {
  let controller: FreelancerController;
  let freelancerService: jest.Mocked<FreelancerService>;

  const mockFreelancerService: jest.Mocked<Partial<any>> = {
    getFreelancer: jest.fn(),
    updateFreelancer: jest.fn(),
  };

  const mockUser = { _id: 'user-id-123', email: 'freelancer@example.com' };
  const mockRequest = { user: mockUser } as unknown as RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FreelancerController],
      providers: [
        { provide: FreelancerService, useValue: mockFreelancerService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(FreelancerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<FreelancerController>(FreelancerController);
    freelancerService = module.get(FreelancerService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getFreelancer ────────────────────────────────────────────────────────
  describe('getFreelancer()', () => {
    it('should call freelancerService.getFreelancer with user._id and return result', async () => {
      const expectedResult = { _id: 'freelancer-id', userId: mockUser._id };
      mockFreelancerService.getFreelancer.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getFreelancer(mockRequest);

      expect(freelancerService.getFreelancer).toHaveBeenCalledTimes(1);
      expect(freelancerService.getFreelancer).toHaveBeenCalledWith(
        mockUser._id,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getFreelancer', async () => {
      mockFreelancerService.getFreelancer.mockRejectedValue(
        new Error('Freelancer not found'),
      );

      await expect(controller.getFreelancer(mockRequest)).rejects.toThrow(
        'Freelancer not found',
      );
    });
  });

  // ─── updateFreelancer ─────────────────────────────────────────────────────
  describe('updateFreelancer()', () => {
    const updateDto: UpdateFreelancerDto = {
      bio: 'Updated bio',
      skills: ['TypeScript', 'NestJS'],
    } as UpdateFreelancerDto;

    it('should call freelancerService.updateFreelancer with user and dto, return result', async () => {
      const expectedResult = { _id: 'freelancer-id', bio: 'Updated bio' };
      mockFreelancerService.updateFreelancer.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.updateFreelancer(mockRequest, updateDto);

      expect(freelancerService.updateFreelancer).toHaveBeenCalledTimes(1);
      expect(freelancerService.updateFreelancer).toHaveBeenCalledWith(
        mockUser,
        updateDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from updateFreelancer', async () => {
      mockFreelancerService.updateFreelancer.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        controller.updateFreelancer(mockRequest, updateDto),
      ).rejects.toThrow('Update failed');
    });
  });
});
