import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './user.schema';
import { BudgetType, ProjectStatus } from 'src/enums/project.enum';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({
    type: String,
    required: true,
    ref: User.name,
  })
  clientId!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxLength: 100,
  })
  title!: string;

  @Prop({
    type: String,
    required: true,
  })
  description!: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  budget!: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(BudgetType),
  })
  budgetType!: BudgetType;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ProjectStatus),
    default: ProjectStatus.OPEN,
  })
  status!: ProjectStatus;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
