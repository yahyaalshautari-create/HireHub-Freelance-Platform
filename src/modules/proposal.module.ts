import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProposalController } from 'src/controllers/proposal.controller';
import { ClientRepository } from 'src/repository/client.repository';
import { FreelancerRepository } from 'src/repository/freelancer.repository';
import { ProjectRepository } from 'src/repository/project.repository';
import { ProposalRepository } from 'src/repository/proposal.repository';
import { Project, ProjectSchema } from 'src/schemas/project.schema';
import { Proposal, ProposalSchema } from 'src/schemas/proposal.schema';
import { ProposalService } from 'src/services/proposal.service';
import { TokenModule } from 'src/token/token.module';
import { NotificationModule } from './notification.module';
import { Freelancer, FreelancerSchema } from 'src/schemas/freelancer.schema';
import { Client, ClientSchema } from 'src/schemas/client.schema';

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
    TokenModule,
    NotificationModule,
  ],
  controllers: [ProposalController],
  providers: [
    ProposalService,
    { provide: 'IProposalRepository', useClass: ProposalRepository },
    { provide: 'IFreelancerRepository', useClass: FreelancerRepository },
    { provide: 'IClientRepository', useClass: ClientRepository },
    { provide: 'IProjectRepository', useClass: ProjectRepository },
  ],
})
export class ProposalModule {}
