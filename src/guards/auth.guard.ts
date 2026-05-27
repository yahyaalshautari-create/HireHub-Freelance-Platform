import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import { TokenService } from 'src/token/token.service';

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const token = request.cookies?.token;

    if (!token) {
      throw new UnauthorizedException('No token is cookies');
    }

    const payload = this.tokenService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = payload as AuthUser;
    return true;
  }
}
