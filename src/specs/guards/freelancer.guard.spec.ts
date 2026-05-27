import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { UserRole } from 'src/enums/user.enum';
import { FreelancerGuard } from 'src/guards/freelancer.guard';
import { messages } from 'src/libs/messages';

describe('FreelancerGuard', () => {
  let guard: FreelancerGuard;

  beforeEach(() => {
    guard = new FreelancerGuard();
  });

  it('should throw if user is not in request', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);

    expect(() => guard.canActivate(context)).toThrow(
      messages.freelancer.unauthorized,
    );
  });

  it('should throw if user role is not FREELANCER or ADMIN', () => {
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

    expect(() => guard.canActivate(context)).toThrow(
      messages.freelancer.forbidden,
    );
  });

  it('should allow FREELANCER user', () => {
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
