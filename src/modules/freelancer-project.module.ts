import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FreelancerProjectController } from 'src/controllers/freelancer-project.controller';
import { FreelancerProjectRepository } from 'src/repository/freelancer-project.repository';
import {
  FreelancerProject,
  FreelancerProjectSchema,
} from 'src/schemas/freelancer-project.schema';
import { FreelancerProjectService } from 'src/services/freelancer-project.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FreelancerProject.name, schema: FreelancerProjectSchema },
    ]),
    TokenModule,
  ],
  controllers: [FreelancerProjectController],
  providers: [
    FreelancerProjectService,
    {
      provide: 'IFreelancerProjectRepository',
      useClass: FreelancerProjectRepository,
    },
  ],
})
export class FreelancerProjectModule {}
