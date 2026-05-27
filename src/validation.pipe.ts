import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { AuthUser } from 'src/interfaces/auth-user.interface';

@Injectable()
export class AuthPipe implements PipeTransform {
  transform(value: AuthUser) {
    if (value.email) {
      value.email = value.email.toLowerCase().trim();
    }

    if (value.fullname) {
      value.fullname = value.fullname.trim().replace(/\s+/g, ' ');
    }

    if (value.password) {
      if (/\s/.test(value.password)) {
        throw new BadRequestException('Password must not contain spaces');
      }
      value.password = value.password.trim();
    }

    return value;
  }
}
