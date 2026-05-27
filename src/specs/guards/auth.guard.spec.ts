import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { TokenService } from 'src/token/token.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockTokenService = {
    verifyToken: jest.fn(),
  };

  beforeEach(() => {
    guard = new AuthGuard(mockTokenService as any);
  });

  it('should throw UnauthorizedException if no token exists', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          cookies: {},
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if token is invalid', () => {
    mockTokenService.verifyToken.mockReturnValue(null);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          cookies: { token: 'invalid-token' },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should allow access and attach user to request', () => {
    const payload = { id: '123', role: 'user' };

    mockTokenService.verifyToken.mockReturnValue(payload);

    const request: any = {
      cookies: { token: 'valid-token' },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
  });
});
