import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Skills } from 'src/enums/freelancer.enum';
import { UserRole } from 'src/enums/user.enum';
import { FreelancerService } from 'src/services/freelancer.service';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFreelancerRepository = {
  findOne: jest.fn(),
  update: jest.fn(),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const buildProfile = (overrides = {}) => ({
  freelancerId: 'freelancer-id-1',
  bio: 'A freelancer',
  skills: [Skills.NO_SKILLS],
  ...overrides,
});

const buildAuthUser = (overrides: any = {}) => ({
  _id: 'freelancer-id-1',
  role: UserRole.FREELANCER,
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('FreelancerService', () => {
  let service: FreelancerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FreelancerService,
        {
          provide: 'IFreelancerRepository',
          useValue: mockFreelancerRepository,
        },
      ],
    }).compile();

    service = module.get<FreelancerService>(FreelancerService);
    jest.clearAllMocks();
  });

  // ── getFreelancer ─────────────────────────────────────────────────────────────

  describe('getFreelancer', () => {
    it('should throw NotFoundException if profile not found', async () => {
      mockFreelancerRepository.findOne.mockResolvedValue(null);
      await expect(service.getFreelancer('freelancer-id-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return freelancer profile', async () => {
      mockFreelancerRepository.findOne.mockResolvedValue(buildProfile());
      const result = await service.getFreelancer('freelancer-id-1');
      expect(result).toBeDefined();
    });
  });

  // ── updateFreelancer ──────────────────────────────────────────────────────────

  describe('updateFreelancer', () => {
    it('should throw NotFoundException if profile not found', async () => {
      mockFreelancerRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateFreelancer(buildAuthUser(), { bio: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not the owner', async () => {
      mockFreelancerRepository.findOne.mockResolvedValue(
        buildProfile({ freelancerId: 'other' }),
      );

      await expect(
        service.updateFreelancer(buildAuthUser({ _id: 'wrong-user' }), {
          bio: 'Updated',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if no data provided', async () => {
      mockFreelancerRepository.findOne.mockResolvedValue(buildProfile());

      await expect(
        service.updateFreelancer(buildAuthUser(), {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if NO_SKILLS is mixed with other skills', async () => {
      mockFreelancerRepository.findOne.mockResolvedValue(buildProfile());

      await expect(
        service.updateFreelancer(buildAuthUser(), {
          skills: [Skills.NO_SKILLS, Skills.JAVASCRIPT],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set skills to NO_SKILLS if empty array provided', async () => {
      mockFreelancerRepository.findOne.mockResolvedValue(buildProfile());
      mockFreelancerRepository.update.mockResolvedValue(
        buildProfile({ skills: [Skills.NO_SKILLS] }),
      );

      await service.updateFreelancer(buildAuthUser(), { skills: [] });

      expect(mockFreelancerRepository.update).toHaveBeenCalledWith(
        { freelancerId: 'freelancer-id-1' },
        expect.objectContaining({ skills: [Skills.NO_SKILLS] }),
      );
    });

    it('should update freelancer profile with valid data', async () => {
      const updated = buildProfile({
        bio: 'Updated',
        skills: [Skills.JAVASCRIPT],
      });
      mockFreelancerRepository.findOne.mockResolvedValue(buildProfile());
      mockFreelancerRepository.update.mockResolvedValue(updated);

      const result = await service.updateFreelancer(buildAuthUser(), {
        bio: 'Updated',
        skills: [Skills.JAVASCRIPT],
      });

      expect(mockFreelancerRepository.update).toHaveBeenCalledWith(
        { freelancerId: 'freelancer-id-1' },
        { bio: 'Updated', skills: [Skills.JAVASCRIPT] },
      );
      expect(result).toBeDefined();
    });
  });
});
