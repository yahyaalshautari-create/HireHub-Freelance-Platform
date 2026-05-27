import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from 'src/services/payment.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import type { RequestWithUser } from 'src/types/express';
import { PaymentController } from 'src/controllers/payment.controller';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;

  const mockPaymentService: jest.Mocked<Partial<any>> = {
    createPayment: jest.fn(),
    getPaymentsUser: jest.fn(),
    releasePayment: jest.fn(),
    refundPayment: jest.fn(),
    rechargeBalance: jest.fn(),
  };

  const mockUser = { _id: 'user-id-123', email: 'user@example.com' };
  const mockRequest = { user: mockUser } as unknown as RequestWithUser;
  const contractId = 'contract-id-abc';
  const paymentId = 'payment-id-xyz';
  const userId = 'user-id-456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentService, useValue: mockPaymentService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get(PaymentService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── createPayment ────────────────────────────────────────────────────────
  describe('createPayment()', () => {
    it('should call paymentService.createPayment with contractId and user._id', async () => {
      const expectedResult = { _id: paymentId, status: 'pending' };
      mockPaymentService.createPayment.mockResolvedValue(expectedResult as any);

      const result = await controller.createPayment(contractId, mockRequest);

      expect(paymentService.createPayment).toHaveBeenCalledTimes(1);
      expect(paymentService.createPayment).toHaveBeenCalledWith(
        contractId,
        mockUser._id,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from createPayment', async () => {
      mockPaymentService.createPayment.mockRejectedValue(
        new Error('Payment failed'),
      );

      await expect(
        controller.createPayment(contractId, mockRequest),
      ).rejects.toThrow('Payment failed');
    });
  });

  // ─── getPaymentsUser ──────────────────────────────────────────────────────
  describe('getPaymentsUser()', () => {
    it('should call paymentService.getPaymentsUser with userId', async () => {
      const expectedResult = [{ _id: paymentId }];
      mockPaymentService.getPaymentsUser.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getPaymentsUser(userId);

      expect(paymentService.getPaymentsUser).toHaveBeenCalledTimes(1);
      expect(paymentService.getPaymentsUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getPaymentsUser', async () => {
      mockPaymentService.getPaymentsUser.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(controller.getPaymentsUser(userId)).rejects.toThrow(
        'User not found',
      );
    });
  });

  // ─── releasePayment ───────────────────────────────────────────────────────
  describe('releasePayment()', () => {
    it('should call paymentService.releasePayment with user and paymentId', async () => {
      const expectedResult = { _id: paymentId, status: 'released' };
      mockPaymentService.releasePayment.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.releasePayment(mockRequest, paymentId);

      expect(paymentService.releasePayment).toHaveBeenCalledTimes(1);
      expect(paymentService.releasePayment).toHaveBeenCalledWith(
        mockUser,
        paymentId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from releasePayment', async () => {
      mockPaymentService.releasePayment.mockRejectedValue(
        new Error('Release failed'),
      );

      await expect(
        controller.releasePayment(mockRequest, paymentId),
      ).rejects.toThrow('Release failed');
    });
  });

  // ─── refundPayment ────────────────────────────────────────────────────────
  describe('refundPayment()', () => {
    it('should call paymentService.refundPayment with user and paymentId', async () => {
      const expectedResult = { _id: paymentId, status: 'refunded' };
      mockPaymentService.refundPayment.mockResolvedValue(expectedResult as any);

      const result = await controller.refundPayment(mockRequest, paymentId);

      expect(paymentService.refundPayment).toHaveBeenCalledTimes(1);
      expect(paymentService.refundPayment).toHaveBeenCalledWith(
        mockUser,
        paymentId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from refundPayment', async () => {
      mockPaymentService.refundPayment.mockRejectedValue(
        new Error('Refund failed'),
      );

      await expect(
        controller.refundPayment(mockRequest, paymentId),
      ).rejects.toThrow('Refund failed');
    });
  });

  // ─── rechargeBalance ──────────────────────────────────────────────────────
  describe('rechargeBalance()', () => {
    it('should call paymentService.rechargeBalance with user._id and amount', async () => {
      const amount = 100;
      const expectedResult = { balance: 200 };
      mockPaymentService.rechargeBalance.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.rechargeBalance(mockRequest, amount);

      expect(paymentService.rechargeBalance).toHaveBeenCalledTimes(1);
      expect(paymentService.rechargeBalance).toHaveBeenCalledWith(
        mockUser._id,
        amount,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from rechargeBalance', async () => {
      mockPaymentService.rechargeBalance.mockRejectedValue(
        new Error('Recharge failed'),
      );

      await expect(controller.rechargeBalance(mockRequest, 50)).rejects.toThrow(
        'Recharge failed',
      );
    });
  });
});
