import { CreateProjectDto } from 'src/dtos/project/create-project.dto';
import { ProjectStatus } from 'src/enums/project.enum';
import { ProjectDocument } from 'src/schemas/project.schema';

export interface IProjectRepository {
  create(
    clientId: string,
    data: CreateProjectDto & {
      status: ProjectStatus;
    },
  ): Promise<ProjectDocument>;

  findByPk(projectId: string): Promise<ProjectDocument | null>;

  findAll(page?: number, limit?: number): Promise<ProjectDocument[]>;

  count(): Promise<number>;

  findByClientId(clientId: string): Promise<ProjectDocument[]>;

  update(
    projectId: string,
    data: Partial<ProjectDocument>,
  ): Promise<ProjectDocument | null>;

  destroy(projectId: string): Promise<void>;

  deleteAll(where?: any): Promise<void>;
}
