import { Module } from '@nestjs/common';
import { Contract, ContractSchema } from 'src/schemas/contract.schema';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { Proposal, ProposalSchema } from 'src/schemas/proposal.schema';
import { ProjectSchema } from 'src/schemas/project.schema';
import { Project } from 'src/schemas/project.schema';
import { ProjectRepository } from 'src/repository/project.repository';
import { ProposalRepository } from 'src/repository/proposal.repository';
import { TokenModule } from 'src/token/token.module';
import { UserSchema } from 'src/schemas/user.schema';
import { User } from 'src/schemas/user.schema';
import { Freelancer, FreelancerSchema } from 'src/schemas/freelancer.schema';
import { ContractOptionController } from 'src/controllers/contract-option.controller';
import { ContractOptionRepository } from 'src/repository/contract-option.repository';
import { FreelancerRepository } from 'src/repository/freelancer.repository';
import { UserRepository } from 'src/repository/user.repository';
import { ContractOptionService } from 'src/services/contract-option.service';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
    ]),
    MongooseModule.forFeature([
      { name: Proposal.name, schema: ProposalSchema },
    ]),
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Freelancer.name, schema: FreelancerSchema },
    ]),
    TokenModule,
    NotificationModule,
  ],
  controllers: [ContractOptionController],
  providers: [
    ContractOptionService,
    {
      provide: 'IContractOptionRepository',
      useClass: ContractOptionRepository,
    },
    {
      provide: 'IProposalOptionRepository',
      useClass: ProposalRepository,
    },
    {
      provide: 'IProjectRepository',
      useClass: ProjectRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IFreelancerRepository',
      useClass: FreelancerRepository,
    },
  ],
})
export class ContractOptionModule {}
