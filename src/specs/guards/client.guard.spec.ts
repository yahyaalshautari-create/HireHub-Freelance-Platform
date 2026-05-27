import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { UserRole } from 'src/enums/user.enum';
import { ClientGuard } from 'src/guards/client.guard';
import { messages } from 'src/libs/messages';

describe('ClientGuard', () => {
  let guard: ClientGuard;

  beforeEach(() => {
    guard = new ClientGuard();
  });

  it('should throw if user is not found in request', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
    expect(() => guard.canActivate(context)).toThrow(
      messages.client.unauthorized,
    );
  });

  it('should throw if user role is neither CLIENT nor ADMIN', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: '1',
            role: UserRole.FREELANCER, 
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(messages.client.forbidden);
  });

  it('should allow CLIENT user', () => {
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

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow ADMIN user', () => {
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

    expect(guard.canActivate(context)).toBe(true);
  });
});
