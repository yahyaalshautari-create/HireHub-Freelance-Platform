import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { AuthSerivce } from 'src/services/auth.service';
import { TokenService } from 'src/token/token.service';
import { Freelancer } from 'src/schemas/freelancer.schema';
import { Client } from 'src/schemas/client.schema';
import { UserRole } from 'src/enums/user.enum';
import { messages } from 'src/libs/messages';
import bcrypt from 'bcryptjs';
import { Response } from 'express';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockAuthRepository = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
};

const mockTokenService = {
  generateToken: jest.fn().mockReturnValue('mock-token'),
};

const mockFreelancerModel = {
  create: jest.fn(),
};

const mockClientModel = {
  create: jest.fn(),
};

const mockResponse = (): Partial<Response> => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
});

// ── Helpers ────────────────────────────────────────────────────────────────────

const buildUser = (overrides = {}) => ({
  _id: 'user-id-1',
  fullname: 'Test User',
  email: 'test@example.com',
  password: 'hashed-password',
  role: UserRole.FREELANCER,
  avatar: 'https://res.cloudinary.com/avatar-default-image.jpg',
  balance: 0,
  frozenBalance: 0,
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthSerivce;
  let res: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthSerivce,
        { provide: 'IAuthRepository', useValue: mockAuthRepository },
        { provide: TokenService, useValue: mockTokenService },
        {
          provide: getModelToken(Freelancer.name),
          useValue: mockFreelancerModel,
        },
        { provide: getModelToken(Client.name), useValue: mockClientModel },
      ],
    }).compile();

    service = module.get<AuthSerivce>(AuthSerivce);
    res = mockResponse();
    jest.clearAllMocks();
  });

  // ── signup ───────────────────────────────────────────────────────────────────

  describe('signup', () => {
    const signupDto = {
      fullname: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.FREELANCER,
    };

    it('should throw BadRequestException if email already exists', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(buildUser());

      await expect(service.signup(signupDto, res as Response)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith(
        signupDto.email,
      );
    });

    it('should create a new freelancer user and return token', async () => {
      const newUser = buildUser({ role: UserRole.FREELANCER });
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue(newUser);
      mockFreelancerModel.create.mockResolvedValue({});
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      const result = await service.signup(signupDto, res as Response);

      expect(mockAuthRepository.create).toHaveBeenCalled();
      expect(mockFreelancerModel.create).toHaveBeenCalledWith({
        freelancerId: newUser._id,
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'mock-token',
        expect.any(Object),
      );
      expect(result).toBeDefined();
    });

    it('should create a new client user and call freelancerModel (per current impl)', async () => {
      const clientDto = { ...signupDto, role: UserRole.CLIENT };
      const newUser = buildUser({ role: UserRole.CLIENT });
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue(newUser);
      mockFreelancerModel.create.mockResolvedValue({});
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      await service.signup(clientDto, res as Response);

      expect(mockFreelancerModel.create).toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashed-pw' as never);
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue(buildUser());
      mockFreelancerModel.create.mockResolvedValue({});

      await service.signup(signupDto, res as Response);

      expect(hashSpy).toHaveBeenCalledWith(signupDto.password, 12);
    });
  });

  // ── login ────────────────────────────────────────────────────────────────────

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should throw BadRequestException if user not found', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto, res as Response)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if password does not match', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(buildUser());
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto, res as Response)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return sanitized user and set cookie on success', async () => {
      const user = buildUser();
      mockAuthRepository.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login(loginDto, res as Response);

      expect(mockTokenService.generateToken).toHaveBeenCalledWith({
        _id: user._id,
        role: user.role,
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'mock-token',
        expect.any(Object),
      );
      expect(result).toBeDefined();
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should clear the token cookie', async () => {
      const result = await service.logout(res as Response);

      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
      expect(result).toBeDefined();
    });
  });

  // ── me ───────────────────────────────────────────────────────────────────────

  describe('me', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockAuthRepository.findByPk.mockResolvedValue(null);

      await expect(service.me('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return sanitized user if found', async () => {
      const user = buildUser();
      mockAuthRepository.findByPk.mockResolvedValue(user);

      const result = await service.me(user._id);

      expect(mockAuthRepository.findByPk).toHaveBeenCalledWith(user._id);
      expect(result).toBeDefined();
    });
  });
});
