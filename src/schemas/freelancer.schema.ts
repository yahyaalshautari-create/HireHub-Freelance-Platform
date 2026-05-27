import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import { JobTitle, Skills } from 'src/enums/freelancer.enum';

export type FreelancerDocument = Freelancer & Document;

@Schema({ timestamps: true })
export class Freelancer {
  @Prop({
    type: String,
    required: true,
    ref: User.name,
  })
  freelancerId!: string;

  @Prop({
    type: String,
    enum: Object.values(JobTitle),
    default: JobTitle.NONE,
  })
  jobTitle!: JobTitle;

  @Prop({
    type: String,
    default: 'No bio yet',
  })
  bio!: string;

  @Prop({
    type: [String],
    enum: Object.values(Skills),
    default: [Skills.NO_SKILLS],
  })
  skills!: Skills[];

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  hourlyRate!: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  totalEarnings!: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  })
  rating!: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  completedProjects!: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  pendingProposals!: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  rejectedProposals!: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  underImplementationProjects!: number;
}

export const FreelancerSchema = SchemaFactory.createForClass(Freelancer);
