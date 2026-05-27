import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from 'src/controllers/auth.controller';
import { AuthRepository } from 'src/repository/auth.repository';
import { Freelancer, FreelancerSchema } from 'src/schemas/freelancer.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { AuthSerivce } from 'src/services/auth.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Freelancer.name, schema: FreelancerSchema },
    ]),
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthSerivce,
    { provide: 'IAuthRepository', useClass: AuthRepository },
  ],
})
export class AuthModule {}
