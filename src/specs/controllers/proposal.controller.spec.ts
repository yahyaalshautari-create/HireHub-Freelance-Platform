import { Test, TestingModule } from '@nestjs/testing';
import { ProposalService } from 'src/services/proposal.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { FreelancerGuard } from 'src/guards/freelancer.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { CreateProposalDto } from 'src/dtos/proposal/create-proposal.dto';
import type { RequestWithUser } from 'src/types/express';
import { ProposalController } from 'src/controllers/proposal.controller';

describe('ProposalController', () => {
  let controller: ProposalController;
  let proposalService: jest.Mocked<ProposalService>;

  const mockProposalService: jest.Mocked<Partial<any>> = {
    createProposal: jest.fn(),
    getProposalsByProject: jest.fn(),
    deleteProposal: jest.fn(),
  };

  const mockUser = { _id: 'user-id-123', email: 'freelancer@example.com' };
  const mockRequest = { user: mockUser } as unknown as RequestWithUser;
  const projectId = 'project-id-abc';
  const proposalId = 'proposal-id-xyz';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProposalController],
      providers: [{ provide: ProposalService, useValue: mockProposalService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(FreelancerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<ProposalController>(ProposalController);
    proposalService = module.get(ProposalService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── createProposal ───────────────────────────────────────────────────────
  describe('createProposal()', () => {
    const createProposalDto: CreateProposalDto = {
      coverLetter: 'I am the best candidate',
      price: 750,
    } as CreateProposalDto;

    it('should call proposalService.createProposal with user, projectId and dto', async () => {
      const expectedResult = { _id: proposalId };
      mockProposalService.createProposal.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.createProposal(
        mockRequest,
        projectId,
        createProposalDto,
      );

      expect(proposalService.createProposal).toHaveBeenCalledTimes(1);
      expect(proposalService.createProposal).toHaveBeenCalledWith(
        mockUser,
        projectId,
        createProposalDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from createProposal', async () => {
      mockProposalService.createProposal.mockRejectedValue(
        new Error('Proposal already exists'),
      );

      await expect(
        controller.createProposal(mockRequest, projectId, createProposalDto),
      ).rejects.toThrow('Proposal already exists');
    });
  });

  // ─── getProposalsByProject ────────────────────────────────────────────────
  describe('getProposalsByProject()', () => {
    it('should call proposalService.getProposalsByProject with default page=1 and limit=10', async () => {
      const expectedResult = { data: [], total: 0 };
      mockProposalService.getProposalsByProject.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getProposalsByProject(projectId);

      expect(proposalService.getProposalsByProject).toHaveBeenCalledWith(
        projectId,
        1,
        10,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should forward custom page and limit', async () => {
      mockProposalService.getProposalsByProject.mockResolvedValue({
        data: [],
      } as any);

      await controller.getProposalsByProject(projectId, 2, 20);

      expect(proposalService.getProposalsByProject).toHaveBeenCalledWith(
        projectId,
        2,
        20,
      );
    });

    it('should propagate errors from getProposalsByProject', async () => {
      mockProposalService.getProposalsByProject.mockRejectedValue(
        new Error('Project not found'),
      );

      await expect(controller.getProposalsByProject(projectId)).rejects.toThrow(
        'Project not found',
      );
    });
  });

  // ─── deleteProposal ───────────────────────────────────────────────────────
  describe('deleteProposal()', () => {
    it('should call proposalService.deleteProposal with user and proposalId', async () => {
      const expectedResult = { message: 'Proposal deleted' };
      mockProposalService.deleteProposal.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.deleteProposal(mockRequest, proposalId);

      expect(proposalService.deleteProposal).toHaveBeenCalledTimes(1);
      expect(proposalService.deleteProposal).toHaveBeenCalledWith(
        mockUser,
        proposalId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from deleteProposal', async () => {
      mockProposalService.deleteProposal.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        controller.deleteProposal(mockRequest, proposalId),
      ).rejects.toThrow('Delete failed');
    });
  });
});
