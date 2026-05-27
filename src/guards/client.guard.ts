import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { UserRole } from 'src/enums/user.enum';
import { messages } from 'src/libs/messages';

@Injectable()
export class ClientGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new BadRequestException(messages.client.unauthorized);
    }

    if (user.role !== UserRole.CLIENT && user.role !== UserRole.ADMIN) {
      throw new BadRequestException(messages.client.forbidden);
    }

    return true;
  }
}
