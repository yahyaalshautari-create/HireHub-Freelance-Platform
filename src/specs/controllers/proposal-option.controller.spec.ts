import { Test, TestingModule } from '@nestjs/testing';
import { ProposalOptionService } from 'src/services/proposal-option.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ClientGuard } from 'src/guards/client.guard';
import { FreelancerGuard } from 'src/guards/freelancer.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { CreateProposalDto } from 'src/dtos/proposal/create-proposal.dto';
import { ProposalStatus } from 'src/enums/proposal.enum';
import type { RequestWithUser } from 'src/types/express';
import { ProposalOptionController } from 'src/controllers/proposal-option.controller';

describe('ProposalOptionController', () => {
  let controller: ProposalOptionController;
  let proposalOptionService: jest.Mocked<ProposalOptionService>;

  const mockProposalOptionService: jest.Mocked<Partial<any>> = {
    updateProposal: jest.fn(),
    getPendingProposalUpdates: jest.fn(),
    approveProposal: jest.fn(),
    updateProposalStatus: jest.fn(),
  };

  const mockUser = { _id: 'user-id-123', email: 'user@example.com' };
  const mockRequest = { user: mockUser } as unknown as RequestWithUser;
  const proposalId = 'proposal-id-abc';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProposalOptionController],
      providers: [
        { provide: ProposalOptionService, useValue: mockProposalOptionService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ClientGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(FreelancerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<ProposalOptionController>(ProposalOptionController);
    proposalOptionService = module.get(ProposalOptionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── updateProposal ───────────────────────────────────────────────────────
  describe('updateProposal()', () => {
    const createProposalDto: CreateProposalDto = {
      coverLetter: 'Updated cover letter',
      price: 500,
    } as CreateProposalDto;

    it('should call service.updateProposal with user, proposalId, and dto', async () => {
      const expectedResult = { _id: proposalId, price: 500 };
      mockProposalOptionService.updateProposal.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.updateProposal(
        mockRequest,
        proposalId,
        createProposalDto,
      );

      expect(proposalOptionService.updateProposal).toHaveBeenCalledTimes(1);
      expect(proposalOptionService.updateProposal).toHaveBeenCalledWith(
        mockUser,
        proposalId,
        createProposalDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from updateProposal', async () => {
      mockProposalOptionService.updateProposal.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        controller.updateProposal(mockRequest, proposalId, createProposalDto),
      ).rejects.toThrow('Update failed');
    });
  });

  // ─── getPendingProposalUpdates ─────────────────────────────────────────────
  describe('getPendingProposalUpdates()', () => {
    it('should call service.getPendingProposalUpdates with user', async () => {
      const expectedResult = [{ _id: proposalId }];
      mockProposalOptionService.getPendingProposalUpdates.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getPendingProposalUpdates(mockRequest);

      expect(
        proposalOptionService.getPendingProposalUpdates,
      ).toHaveBeenCalledTimes(1);
      expect(
        proposalOptionService.getPendingProposalUpdates,
      ).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getPendingProposalUpdates', async () => {
      mockProposalOptionService.getPendingProposalUpdates.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(
        controller.getPendingProposalUpdates(mockRequest),
      ).rejects.toThrow('Fetch failed');
    });
  });

  // ─── approveProposal ──────────────────────────────────────────────────────
  describe('approveProposal()', () => {
    it('should call service.approveProposal with user and proposalId', async () => {
      const expectedResult = { _id: proposalId, status: 'approved' };
      mockProposalOptionService.approveProposal.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.approveProposal(mockRequest, proposalId);

      expect(proposalOptionService.approveProposal).toHaveBeenCalledTimes(1);
      expect(proposalOptionService.approveProposal).toHaveBeenCalledWith(
        mockUser,
        proposalId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from approveProposal', async () => {
      mockProposalOptionService.approveProposal.mockRejectedValue(
        new Error('Approve failed'),
      );

      await expect(
        controller.approveProposal(mockRequest, proposalId),
      ).rejects.toThrow('Approve failed');
    });
  });

  // ─── updateProposalStatus ─────────────────────────────────────────────────
  describe('updateProposalStatus()', () => {
    it('should call service.updateProposalStatus with user, proposalId and status', async () => {
      const status = ProposalStatus.ACCEPTED;
      const expectedResult = { _id: proposalId, status };
      mockProposalOptionService.updateProposalStatus.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.updateProposalStatus(
        mockRequest,
        proposalId,
        status,
      );

      expect(proposalOptionService.updateProposalStatus).toHaveBeenCalledTimes(
        1,
      );
      expect(proposalOptionService.updateProposalStatus).toHaveBeenCalledWith(
        mockUser,
        proposalId,
        status,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle REJECTED status', async () => {
      const status = ProposalStatus.REJECTED;
      mockProposalOptionService.updateProposalStatus.mockResolvedValue({
        status,
      } as any);

      await controller.updateProposalStatus(mockRequest, proposalId, status);

      expect(proposalOptionService.updateProposalStatus).toHaveBeenCalledWith(
        mockUser,
        proposalId,
        ProposalStatus.REJECTED,
      );
    });

    it('should propagate errors from updateProposalStatus', async () => {
      mockProposalOptionService.updateProposalStatus.mockRejectedValue(
        new Error('Status update failed'),
      );

      await expect(
        controller.updateProposalStatus(
          mockRequest,
          proposalId,
          ProposalStatus.ACCEPTED,
        ),
      ).rejects.toThrow('Status update failed');
    });
  });
});
