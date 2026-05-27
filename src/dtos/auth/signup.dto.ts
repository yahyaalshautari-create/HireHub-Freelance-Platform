import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/enums/user.enum';

export class SignUpDto {
  @IsString({ message: 'The full name must be in text' })
  @IsNotEmpty({ message: 'Fullname is required' })
  @MinLength(3, { message: 'The fullname is very short' })
  @MaxLength(50, { message: 'The fullname is too long' })
  fullname!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'The password must be in text' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'The password is very short' })
  @MaxLength(40, { message: 'The password is too long' })
  password!: string;

  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(UserRole, { message: 'Invalid role value' })
  role!: UserRole;
}
