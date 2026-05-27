import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Freelancer } from './freelancer.schema';

export type FreelancerProjectDocument = FreelancerProject & Document;

@Schema({ timestamps: true })
export class FreelancerProject {
  @Prop({
    type: String,
    required: true,
  })
  title!: string;

  @Prop({
    type: String,
    required: true,
  })
  description!: string;

  @Prop({
    type: [String],
    default: [],
  })
  images!: string[];

  @Prop({
    type: String,
    required: true,
    ref: Freelancer.name,
  })
  freelancerId!: string;

  @Prop()
  linkDemo?: string;
}

export const FreelancerProjectSchema =
  SchemaFactory.createForClass(FreelancerProject);
