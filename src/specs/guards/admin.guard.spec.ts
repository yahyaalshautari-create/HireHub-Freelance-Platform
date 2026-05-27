import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/enums/user.enum';
import { AdminGuard } from 'src/guards/admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard(new Reflector());
  });

  it('should throw UnauthorizedException if user is not in request', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if user is not admin', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: '1',
            role: UserRole.CLIENT,
          },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow('Admin only');
  });

  it('should allow access if user is admin', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: '1',
            role: UserRole.ADMIN,
          },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });
});
