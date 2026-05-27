import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from 'src/enums/user.enum';
import { ClientService } from 'src/services/client.service';
import { ForbiddenException } from '@nestjs/common';
const mockClientRepository = {
  findOne: jest.fn(),
  update: jest.fn(),
};

const buildProfile = (overrides = {}) => ({
  clientId: 'client-id-1',
  bio: 'A client',
  ...overrides,
});

const buildAuthUser = (overrides: any = {}) => ({
  _id: 'client-id-1',
  role: UserRole.CLIENT,
  ...overrides,
});

describe('ClientService', () => {
  let service: ClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        { provide: 'IClientRepository', useValue: mockClientRepository },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    jest.clearAllMocks();
  });

  describe('getClient', () => {
    it('should throw NotFoundException if client not found', async () => {
      mockClientRepository.findOne.mockResolvedValue(null);
      await expect(service.getClient('client-id-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return client profile', async () => {
      mockClientRepository.findOne.mockResolvedValue(buildProfile());
      const result = await service.getClient('client-id-1');
      expect(result).toBeDefined();
    });
  });

  describe('updateClient', () => {
    it('should throw NotFoundException if profile not found', async () => {
      mockClientRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateClient(buildAuthUser(), { bio: 'New bio' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no data provided', async () => {
      mockClientRepository.findOne.mockResolvedValue(buildProfile());
      await expect(service.updateClient(buildAuthUser(), {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if caller is not the owner', async () => {
      mockClientRepository.findOne.mockResolvedValue(
        buildProfile({ clientId: 'other-client' }),
      );

      
      await expect(
        service.updateClient(buildAuthUser({ _id: 'wrong-user' }), {
          bio: 'Bio',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update and return profile', async () => {
      const updatedProfile = buildProfile({ bio: 'Updated bio' });
      mockClientRepository.findOne.mockResolvedValue(buildProfile());
      mockClientRepository.update.mockResolvedValue(updatedProfile);

      const result = await service.updateClient(buildAuthUser(), {
        bio: 'Updated bio',
      });

      expect(mockClientRepository.update).toHaveBeenCalledWith(
        { clientId: 'client-id-1' },
        { bio: 'Updated bio' },
      );
      expect(result).toBeDefined();
    });
  });
});
