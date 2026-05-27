import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import { CompanyName } from 'src/enums/client.enum';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
  @Prop({
    type: String,
    required: true,
    ref: User.name,
  })
  clientId!: string;

  @Prop({
    type: String,
    enum: Object.values(CompanyName),
    default: CompanyName.INDIVIDUAL,
  })
  companyName!: string;

  @Prop({
    type: String,
    default: 'No bio yet',
  })
  bio!: string;

  @Prop({
    type: Number,
    default: 0,
  })
  totalSpent!: number;

  @Prop({
    type: Number,
    default: 0,
  })
  completedProjects!: number;

  @Prop({
    type: Number,
    default: 0,
  })
  pendingProposals!: number;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
