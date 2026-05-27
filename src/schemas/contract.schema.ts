import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Proposal } from './proposal.schema';
import { Project } from './project.schema';
import { ContractStatus, ReviewContractStatus } from 'src/enums/contract.enum';
import { UserRole } from 'src/enums/user.enum';
import { Document } from 'mongoose';

export type ContractDocument = Contract & Document;

@Schema({ timestamps: true })
export class Contract {
  @Prop({
    type: String,
    ref: Project.name,
    required: true,
  })
  projectId!: string;

  @Prop({
    type: String,
    ref: Proposal.name,
    required: true,
  })
  proposalId!: string;

  @Prop({
    type: String,
    ref: User.name,
    required: true,
  })
  clientId!: string;

  @Prop({
    type: String,
    ref: User.name,
    required: true,
  })
  freelancerId!: string;

  @Prop({
    type: String,
    default: ContractStatus.ACTIVE,
    enum: Object.values(ContractStatus),
  })
  status!: ContractStatus;

  @Prop({
    type: String,
    enum: Object.values(ReviewContractStatus),
    default: null,
  })
  reviewContractStatus?: string;

  @Prop({ default: false })
  cancelRequested!: boolean;

  @Prop({ type: String, enum: [UserRole.CLIENT, UserRole.FREELANCER] })
  cancelRequestedBy?: string;

  @Prop({
    type: Date,
    default: null,
  })
  startedAt!: Date;

  @Prop({
    type: Date,
    default: null,
  })
  completedAt!: Date | null;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);
