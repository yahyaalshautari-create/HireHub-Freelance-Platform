import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FreelancerController } from 'src/controllers/freelancer.controller';
import { FreelancerRepository } from 'src/repository/freelancer.repository';
import { Freelancer, FreelancerSchema } from 'src/schemas/freelancer.schema';
import { FreelancerService } from 'src/services/freelancer.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Freelancer.name, schema: FreelancerSchema },
    ]),
    TokenModule,
  ],
  controllers: [FreelancerController],
  providers: [FreelancerService, {
    provide: "IFreelancerRepository",
    useClass: FreelancerRepository
  }],
})
export class FreelancerModule {}
