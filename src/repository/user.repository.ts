import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import { User, UserDocument } from 'src/schemas/user.schema';
import { VerificationStatus } from 'src/enums/user.enum';

export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findByPk(userId: string): Promise<AuthUser | null> {
    return this.userModel.findById(userId).lean().exec();
  }

  async findAll(userId: string, page = 1, limit = 10): Promise<AuthUser[]> {
    const skip = (page - 1) * limit;

    return this.userModel
      .find({ _id: { $ne: userId } })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async count(userId: string): Promise<number> {
    return this.userModel.countDocuments({ _id: { $ne: userId } });
  }

  async create(data: Partial<AuthUser>): Promise<AuthUser> {
    const user = await this.userModel.create(data);
    return user.toObject();
  }

  async update(
    data: Partial<AuthUser>,
    where: UpdateQuery<AuthUser>,
  ): Promise<void> {
    await this.userModel.updateMany(where, data);
  }

  async destroy(where: Partial<AuthUser>): Promise<void> {
    await this.userModel.deleteMany(where);
  }

  async findPendingVerification(): Promise<AuthUser[]> {
    return this.userModel
      .find({ verificationStatus: VerificationStatus.PENDING })
      .select(
        'fullname email avatar idCardImage selfieImage verificationStatus createdAt',
      )
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findMany(filter: any) {
    return this.userModel.find(filter).exec();
  }
}
