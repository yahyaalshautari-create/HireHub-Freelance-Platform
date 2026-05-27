import { Module } from '@nestjs/common';
import { Proposal, ProposalSchema } from 'src/schemas/proposal.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenModule } from 'src/token/token.module';
import { Project, ProjectSchema } from 'src/schemas/project.schema';
import { UserSchema } from 'src/schemas/user.schema';
import { User } from 'src/schemas/user.schema';
import { ProposalOptionController } from 'src/controllers/proposal-option.controller';
import { ProposalOptionRepository } from 'src/repository/proposal-option.repository';
import { ProposalOptionService } from 'src/services/proposal-option.service';
import { UserRepository } from 'src/repository/user.repository';
import { ProjectRepository } from 'src/repository/project.repository';
import { NotificationModule } from './notification.module';
import { ProposalHelperModule } from './proposal-helper.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proposal.name, schema: ProposalSchema },
    ]),
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationModule,
    ProposalHelperModule,
    TokenModule,
  ],
  controllers: [ProposalOptionController],
  providers: [
    ProposalOptionService,
    {
      provide: 'IProposalOptionRepository',
      useClass: ProposalOptionRepository,
    },
    ProposalOptionService,
    { provide: 'IProjectRepository', useClass: ProjectRepository },
    ProposalOptionService,
    { provide: 'IUserRepository', useClass: UserRepository },
  ],
})
export class ProposalOptionModule {}
