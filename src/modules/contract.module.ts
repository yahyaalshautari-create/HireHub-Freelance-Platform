import { Module } from '@nestjs/common';
import { ContractController } from 'src/controllers/contract.controller';
import { ContractService } from 'src/services/contract.service';
import { Contract, ContractSchema } from 'src/schemas/contract.schema';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { Proposal, ProposalSchema } from 'src/schemas/proposal.schema';
import { ProjectSchema } from 'src/schemas/project.schema';
import { Project } from 'src/schemas/project.schema';
import { ContractRepository } from 'src/repository/contract.repository';
import { ProjectRepository } from 'src/repository/project.repository';
import { ProposalRepository } from 'src/repository/proposal.repository';
import { TokenModule } from 'src/token/token.module';
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

    TokenModule,
    NotificationModule,
  ],
  controllers: [ContractController],
  providers: [
    ContractService,

    {
      provide: 'IContractRepository',
      useClass: ContractRepository,
    },

    {
      provide: 'IProposalRepository',
      useClass: ProposalRepository,
    },

    {
      provide: 'IProjectRepository',
      useClass: ProjectRepository,
    },
  ],
})
export class ContractModule {}
