import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TokenService } from 'src/token/token.service';
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { SignUpDto } from 'src/dtos/auth/signup.dto';
import type { IAuthRepository } from 'src/interfaces/auth.interface';
import { LoginDto } from 'src/dtos/auth/login.dto';
import { response, sanitizeUser } from 'src/libs/helpers';
import { messages } from 'src/libs/messages';
import { InjectModel } from '@nestjs/mongoose';
import { Freelancer, FreelancerDocument } from 'src/schemas/freelancer.schema';
import { Model } from 'mongoose';
import { UserRole } from 'src/enums/user.enum';
@Injectable()
export class AuthSerivce {
  constructor(
    @Inject('IAuthRepository') private readonly authRepository: IAuthRepository,
    @InjectModel(Freelancer.name)
    private readonly freelancerModel: Model<FreelancerDocument>,
    private readonly tokenService: TokenService,
  ) {}

  private getCookieOptions(isLogout = false) {
    return {
      httpOnly: true,
      secure: true, // localhost : false, production : true
      sameSite: 'none' as const, // localhost : lax, production : none
      maxAge: isLogout ? 0 : 365 * 24 * 60 * 60 * 1000,
    };
  }

  async signup(data: SignUpDto, res: Response) {
    const { fullname, email, password, role } = data;

    const existing = await this.authRepository.findByEmail(email);

    if (existing) {
      throw new BadRequestException(messages.auth.signup.failed);
    }

    const hashed = await bcrypt.hash(password, 12);

    const newUser = await this.authRepository.create({
      fullname,
      email,
      password: hashed,
      role,
      avatar:
        'https://res.cloudinary.com/dgagbheuj/image/upload/v1763194734/avatar-default-image_yc4xy4.jpg',
      balance: 0,
      frozenBalance: 0,
    });

    if (newUser.role === UserRole.FREELANCER) {
      await this.freelancerModel.create({
        freelancerId: newUser._id,
      });
    }

    if (newUser.role === UserRole.CLIENT) {
      await this.freelancerModel.create({
        freelancerId: newUser._id,
      });
    }

    const token = this.tokenService.generateToken({
      _id: newUser._id,
      role: newUser.role,
    });

    res.cookie('token', token, this.getCookieOptions());

    const safeUser = sanitizeUser(newUser);

    const message = messages.auth.signup.success;
    return response(safeUser, message);
  }

  async login(data: LoginDto, res: Response) {
    const { email, password } = data;

    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestException(messages.auth.login.failed);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new BadRequestException(messages.auth.login.failed);
    }

    const token = this.tokenService.generateToken({
      _id: user._id,
      role: user.role,
    });

    res.cookie('token', token, this.getCookieOptions());

    const safeUser = sanitizeUser(user);

    const message = messages.auth.login.success;

    return response(safeUser, message);
  }

  async logout(res: Response) {
    res.clearCookie('token', this.getCookieOptions(true));

    const message = messages.auth.logout.success;

    return response(null, message);
  }

  async me(userId: string) {
    const user = await this.authRepository.findByPk(userId);

    if (!user) {
      throw new NotFoundException(messages.auth.me);
    }

    const safeUser = sanitizeUser(user);

    return response(safeUser, null);
  }
}
