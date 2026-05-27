import { Test, TestingModule } from '@nestjs/testing';
import { ContractOptionService } from 'src/services/contract-option.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { ReviewContractStatus } from 'src/enums/contract.enum';
import type { RequestWithUser } from 'src/types/express';
import { ContractOptionController } from 'src/controllers/contract-option.controller';

describe('ContractOptionController', () => {
  let controller: ContractOptionController;
  let contractOptionService: jest.Mocked<ContractOptionService>;

  const mockContractOptionService: jest.Mocked<Partial<any>> =
    {
      completeContract: jest.fn(),
      requestCancelContract: jest.fn(),
      getPendingCancelRequests: jest.fn(),
      reviewCancelContract: jest.fn(),
    };

  const mockUser = { _id: 'user-id-123', email: 'user@example.com' };
  const mockRequest = { user: mockUser } as unknown as RequestWithUser;
  const contractId = 'contract-id-abc';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractOptionController],
      providers: [
        { provide: ContractOptionService, useValue: mockContractOptionService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<ContractOptionController>(ContractOptionController);
    contractOptionService = module.get(ContractOptionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── completeContract ─────────────────────────────────────────────────────
  describe('completeContract()', () => {
    it('should call contractOptionService.completeContract with user and contractId', async () => {
      const expectedResult = { message: 'Contract completed' };
      mockContractOptionService.completeContract.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.completeContract(mockRequest, contractId);

      expect(contractOptionService.completeContract).toHaveBeenCalledTimes(1);
      expect(contractOptionService.completeContract).toHaveBeenCalledWith(
        mockUser,
        contractId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from completeContract', async () => {
      mockContractOptionService.completeContract.mockRejectedValue(
        new Error('Contract not found'),
      );

      await expect(
        controller.completeContract(mockRequest, contractId),
      ).rejects.toThrow('Contract not found');
    });
  });

  // ─── requestCancelContract ────────────────────────────────────────────────
  describe('requestCancelContract()', () => {
    it('should call contractOptionService.requestCancelContract with user and contractId', async () => {
      const expectedResult = { message: 'Cancellation requested' };
      mockContractOptionService.requestCancelContract.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.requestCancelContract(
        mockRequest,
        contractId,
      );

      expect(contractOptionService.requestCancelContract).toHaveBeenCalledTimes(
        1,
      );
      expect(contractOptionService.requestCancelContract).toHaveBeenCalledWith(
        mockUser,
        contractId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from requestCancelContract', async () => {
      mockContractOptionService.requestCancelContract.mockRejectedValue(
        new Error('Cannot cancel'),
      );

      await expect(
        controller.requestCancelContract(mockRequest, contractId),
      ).rejects.toThrow('Cannot cancel');
    });
  });

  // ─── getPendingCancelRequests ─────────────────────────────────────────────
  describe('getPendingCancelRequests()', () => {
    it('should call service with user, default page=1 and limit=10', async () => {
      const expectedResult = { data: [], total: 0 };
      mockContractOptionService.getPendingCancelRequests.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getPendingCancelRequests(mockRequest);

      expect(
        contractOptionService.getPendingCancelRequests,
      ).toHaveBeenCalledWith(mockUser, 1, 10);
      expect(result).toEqual(expectedResult);
    });

    it('should forward custom page and limit to service', async () => {
      mockContractOptionService.getPendingCancelRequests.mockResolvedValue({
        data: [],
      } as any);

      await controller.getPendingCancelRequests(mockRequest, 3, 20);

      expect(
        contractOptionService.getPendingCancelRequests,
      ).toHaveBeenCalledWith(mockUser, 3, 20);
    });
  });

  // ─── reviewCancelContract ─────────────────────────────────────────────────
  describe('reviewCancelContract()', () => {
    it('should call service with user, contractId, and status', async () => {
      const status = ReviewContractStatus.APPROVED;
      const expectedResult = { message: 'Review done' };
      mockContractOptionService.reviewCancelContract.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.reviewCancelContract(
        mockRequest,
        contractId,
        status,
      );

      expect(contractOptionService.reviewCancelContract).toHaveBeenCalledTimes(
        1,
      );
      expect(contractOptionService.reviewCancelContract).toHaveBeenCalledWith(
        mockUser,
        contractId,
        status,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from reviewCancelContract', async () => {
      mockContractOptionService.reviewCancelContract.mockRejectedValue(
        new Error('Review failed'),
      );

      await expect(
        controller.reviewCancelContract(
          mockRequest,
          contractId,
          ReviewContractStatus.REJECTED,
        ),
      ).rejects.toThrow('Review failed');
    });
  });
});
