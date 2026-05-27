import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString({ message: 'The password must be in text' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'The password is very short' })
  @MaxLength(40, { message: 'The password is too long' })
  password!: string;
}
