import { Test, TestingModule } from '@nestjs/testing';
import { ClientService } from 'src/services/client.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ClientGuard } from 'src/guards/client.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { UpdateClientDto } from 'src/dtos/client/UpdateClientDto';
import type { RequestWithUser } from 'src/types/express';
import { ClientController } from 'src/controllers/client.controller';
import { CompanyName } from 'src/enums/client.enum';

describe('ClientController', () => {
  let controller: ClientController;
  let clientService: jest.Mocked<ClientService>;

  const mockClientService: jest.Mocked<any> = {
    getClient: jest.fn(),
    updateClient: jest.fn(),
  };

  const mockUser = {
    _id: 'user-id-123',
    email: 'client@example.com',
    name: 'Test Client',
  };

  const mockRequest = {
    user: mockUser,
  } as unknown as RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [{ provide: ClientService, useValue: mockClientService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ClientGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<ClientController>(ClientController);
    clientService = module.get(ClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getClient ────────────────────────────────────────────────────────────
  describe('getClient()', () => {
    it('should call clientService.getClient with user._id and return result', async () => {
      const expectedResult = { _id: 'client-id-123', userId: 'user-id-123' };
      mockClientService.getClient.mockResolvedValue(expectedResult as any);

      const result = await controller.getClient(mockRequest);

      expect(clientService.getClient).toHaveBeenCalledTimes(1);
      expect(clientService.getClient).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors thrown by clientService.getClient', async () => {
      mockClientService.getClient.mockRejectedValue(
        new Error('Client not found'),
      );

      await expect(controller.getClient(mockRequest)).rejects.toThrow(
        'Client not found',
      );
    });
  });

  // ─── updateClient ─────────────────────────────────────────────────────────
  describe('updateClient()', () => {
    const updateClientDto: UpdateClientDto = {
      companyName: CompanyName.NON_PROFIT,
      bio: 'New bio',
    };

    it('should call clientService.updateClient with user and dto, return result', async () => {
      const expectedResult = {
        _id: 'client-id-123',
        companyName: 'New Company',
      };
      mockClientService.updateClient.mockResolvedValue(expectedResult as any);

      const result = await controller.updateClient(
        mockRequest,
        updateClientDto,
      );

      expect(clientService.updateClient).toHaveBeenCalledTimes(1);
      expect(clientService.updateClient).toHaveBeenCalledWith(
        mockUser,
        updateClientDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors thrown by clientService.updateClient', async () => {
      mockClientService.updateClient.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        controller.updateClient(mockRequest, updateClientDto),
      ).rejects.toThrow('Update failed');
    });
  });
});
