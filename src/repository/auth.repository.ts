import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import { IAuthRepository } from 'src/interfaces/auth.interface';
import { User, UserDocument } from 'src/schemas/user.schema';

export class AuthRepository implements IAuthRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  findByEmail(email: string): Promise<AuthUser | null> {
    return this.userModel.findOne({ email }).select('+password');
  }

  create(data: Partial<AuthUser>): Promise<AuthUser> {
    return this.userModel.create(data);
  }

  findByPk(userId: string): Promise<AuthUser | null> {
    return this.userModel.findById(userId).lean().exec();
  }
}