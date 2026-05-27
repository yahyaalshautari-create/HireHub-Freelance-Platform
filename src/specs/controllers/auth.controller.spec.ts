import { Test, TestingModule } from '@nestjs/testing';
import { AuthSerivce } from 'src/services/auth.service';
import { AuthPipe } from 'src/validation.pipe';
import { AuthGuard } from 'src/guards/auth.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { SignUpDto } from 'src/dtos/auth/signup.dto';
import { LoginDto } from 'src/dtos/auth/login.dto';
import type { Response } from 'express';
import type { RequestWithUser } from 'src/types/express';
import { AuthController } from 'src/controllers/auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthSerivce>;

  const mockAuthService: any = {
    signup: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
  };
  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  const mockUser = {
    _id: 'user-id-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockRequest = {
    user: mockUser,
  } as unknown as RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthSerivce, useValue: mockAuthService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overridePipe(AuthPipe)
      .useValue({ transform: jest.fn((val) => val) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthSerivce);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── signup ───────────────────────────────────────────────────────────────
  describe('signup()', () => {
    const signUpDto: SignUpDto = {
      email: 'test@example.com',
      password: 'password123',
      fullname: 'Test User',
    } as SignUpDto;

    it('should call authService.signup with correct args and return result', async () => {
      const expectedResult = { message: 'User created successfully' };
      mockAuthService.signup.mockResolvedValue(expectedResult as any);

      const result = await controller.signup(signUpDto, mockResponse);

      expect(authService.signup).toHaveBeenCalledTimes(1);
      expect(authService.signup).toHaveBeenCalledWith(signUpDto, mockResponse);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors thrown by authService.signup', async () => {
      mockAuthService!.signup.mockRejectedValue(
        new Error('Email already exists'),
      );

      await expect(controller.signup(signUpDto, mockResponse)).rejects.toThrow(
        'Email already exists',
      );
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────
  describe('login()', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    } as LoginDto;

    it('should call authService.login with correct args and return result', async () => {
      const expectedResult = { accessToken: 'jwt-token' };
      mockAuthService.login.mockResolvedValue(expectedResult as any);

      const result = await controller.login(loginDto, mockResponse);

      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(authService.login).toHaveBeenCalledWith(loginDto, mockResponse);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors thrown by authService.login', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────
  describe('logout()', () => {
    it('should call authService.logout with response and return result', async () => {
      const expectedResult = { message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(expectedResult as any);

      const result = await controller.logout(mockResponse);

      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(authService.logout).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors thrown by authService.logout', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(controller.logout(mockResponse)).rejects.toThrow(
        'Logout failed',
      );
    });
  });

  // ─── me ───────────────────────────────────────────────────────────────────
  describe('me()', () => {
    it('should call authService.me with user._id and return result', async () => {
      const expectedResult = { _id: 'user-id-123', email: 'test@example.com' };
      mockAuthService.me.mockResolvedValue(expectedResult as any); // Property 'mockResolvedValue' does not exist on type '(userId: string) => Promise<{ message: string | null; data: any; }>'.ts(2339)

      const result = await controller.me(mockRequest);

      expect(authService.me).toHaveBeenCalledTimes(1);
      expect(authService.me).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors thrown by authService.me', async () => {
      mockAuthService.me.mockRejectedValue(new Error('User not found'));

      await expect(controller.me(mockRequest)).rejects.toThrow(
        'User not found',
      );
    });
  });
});
