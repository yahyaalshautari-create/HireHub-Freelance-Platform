import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectController } from 'src/controllers/project.controller';
import { Project, ProjectSchema } from 'src/schemas/project.schema';
import { UserSchema } from 'src/schemas/user.schema';
import { User } from 'src/schemas/user.schema';
import { ProjectService } from 'src/services/project.service';
import { TokenModule } from 'src/token/token.module';
import { ProjectRepository } from 'src/repository/project.repository';
import { UserRepository } from 'src/repository/user.repository';
import { Proposal, ProposalSchema } from 'src/schemas/proposal.schema';
import { ProposalRepository } from 'src/repository/proposal.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    MongooseModule.forFeature([
      { name: Proposal.name, schema: ProposalSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    TokenModule,
  ],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    {
      provide: 'IProjectRepository',
      useClass: ProjectRepository,
    },
    {
      provide: 'IProposalRepository',
      useClass: ProposalRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
})
export class ProjectModule {}
