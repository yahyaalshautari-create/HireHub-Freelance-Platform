import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProposalHelper } from 'src/libs/proposal.helper';
import { ClientRepository } from 'src/repository/client.repository';
import { FreelancerRepository } from 'src/repository/freelancer.repository';
import { ProjectRepository } from 'src/repository/project.repository';
import { ProposalRepository } from 'src/repository/proposal.repository';
import { Client, ClientSchema } from 'src/schemas/client.schema';
import { Freelancer, FreelancerSchema } from 'src/schemas/freelancer.schema';
import { Project, ProjectSchema } from 'src/schemas/project.schema';
import { Proposal, ProposalSchema } from 'src/schemas/proposal.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proposal.name, schema: ProposalSchema },
    ]),
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    MongooseModule.forFeature([
      { name: Freelancer.name, schema: FreelancerSchema },
    ]),
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
  ],
  providers: [
    ProposalHelper,
    {
      provide: 'IProposalOptionRepository',
      useClass: ProposalRepository,
    },
    {
      provide: 'IProjectRepository',
      useClass: ProjectRepository,
    },
    {
      provide: 'IFreelancerRepository',
      useClass: FreelancerRepository,
    },
    {
      provide: 'IClientRepository',
      useClass: ClientRepository,
    },
  ],
  exports: [ProposalHelper],
})
export class ProposalHelperModule {}
