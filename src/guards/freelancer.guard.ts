import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { UserRole } from 'src/enums/user.enum';
import { messages } from 'src/libs/messages';

@Injectable()
export class FreelancerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new BadRequestException(messages.freelancer.unauthorized);
    }

    if (user.role !== UserRole.FREELANCER && user.role !== UserRole.ADMIN) {
      throw new BadRequestException(messages.freelancer.forbidden);
    }

    return true;
  }
}
