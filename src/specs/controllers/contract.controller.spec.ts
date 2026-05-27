import { Test, TestingModule } from '@nestjs/testing';
import { ContractService } from 'src/services/contract.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { AdminGuard } from 'src/guards/admin.guard';
import { ClientGuard } from 'src/guards/client.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import type { RequestWithUser } from 'src/types/express';
import { ContractController } from 'src/controllers/contract.controller';

describe('ContractController', () => {
  let controller: ContractController;
  let contractService: jest.Mocked<ContractService>;

  const mockContractService: jest.Mocked<Partial<any>> = {
    createContract: jest.fn(),
    getAllContracts: jest.fn(),
    getMyContractWithUser: jest.fn(),
    getContractById: jest.fn(),
    deleteContract: jest.fn(),
  };

  const mockUser = { _id: 'user-id-123', email: 'user@example.com' };
  const mockRequest = { user: mockUser } as unknown as RequestWithUser;
  const contractId = 'contract-id-abc';
  const proposalId = 'proposal-id-xyz';
  const otherUserId = 'other-user-id-456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractController],
      providers: [{ provide: ContractService, useValue: mockContractService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ClientGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<ContractController>(ContractController);
    contractService = module.get(ContractService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── createContract ───────────────────────────────────────────────────────
  describe('createContract()', () => {
    it('should call contractService.createContract with user and proposalId', async () => {
      const expectedResult = { _id: contractId };
      mockContractService.createContract.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.createContract(mockRequest, proposalId);

      expect(contractService.createContract).toHaveBeenCalledTimes(1);
      expect(contractService.createContract).toHaveBeenCalledWith(
        mockUser,
        proposalId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from createContract', async () => {
      mockContractService.createContract.mockRejectedValue(
        new Error('Proposal not found'),
      );

      await expect(
        controller.createContract(mockRequest, proposalId),
      ).rejects.toThrow('Proposal not found');
    });
  });

  // ─── getAllContracts ───────────────────────────────────────────────────────
  describe('getAllContracts()', () => {
    it('should call contractService.getAllContracts with default page=1 and limit=10', async () => {
      const expectedResult = { data: [], total: 0 };
      mockContractService.getAllContracts.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getAllContracts();

      expect(contractService.getAllContracts).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(expectedResult);
    });

    it('should forward custom page and limit', async () => {
      mockContractService.getAllContracts.mockResolvedValue({
        data: [],
      } as any);

      await controller.getAllContracts(2, 5);

      expect(contractService.getAllContracts).toHaveBeenCalledWith(2, 5);
    });
  });

  // ─── getMyContractWithUser ─────────────────────────────────────────────────
  describe('getMyContractWithUser()', () => {
    it('should call service with user and otherUserId', async () => {
      const expectedResult = { _id: contractId };
      mockContractService.getMyContractWithUser.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getMyContractWithUser(
        mockRequest,
        otherUserId,
      );

      expect(contractService.getMyContractWithUser).toHaveBeenCalledTimes(1);
      expect(contractService.getMyContractWithUser).toHaveBeenCalledWith(
        mockUser,
        otherUserId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getMyContractWithUser', async () => {
      mockContractService.getMyContractWithUser.mockRejectedValue(
        new Error('Contract not found'),
      );

      await expect(
        controller.getMyContractWithUser(mockRequest, otherUserId),
      ).rejects.toThrow('Contract not found');
    });
  });

  // ─── getContractById ──────────────────────────────────────────────────────
  describe('getContractById()', () => {
    it('should call contractService.getContractById with contractId', async () => {
      const expectedResult = { _id: contractId, status: 'active' };
      mockContractService.getContractById.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getContractById(contractId);

      expect(contractService.getContractById).toHaveBeenCalledTimes(1);
      expect(contractService.getContractById).toHaveBeenCalledWith(contractId);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getContractById', async () => {
      mockContractService.getContractById.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(controller.getContractById(contractId)).rejects.toThrow(
        'Not found',
      );
    });
  });

  // ─── deleteContract ───────────────────────────────────────────────────────
  describe('deleteContract()', () => {
    it('should call contractService.deleteContract with contractId', async () => {
      const expectedResult = { message: 'Contract deleted' };
      mockContractService.deleteContract.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.deleteContract(contractId);

      expect(contractService.deleteContract).toHaveBeenCalledTimes(1);
      expect(contractService.deleteContract).toHaveBeenCalledWith(contractId);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from deleteContract', async () => {
      mockContractService.deleteContract.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(controller.deleteContract(contractId)).rejects.toThrow(
        'Delete failed',
      );
    });
  });
});
