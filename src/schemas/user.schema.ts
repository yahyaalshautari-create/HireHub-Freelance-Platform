import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserRole, VerificationStatus } from 'src/enums/user.enum';
import { v4 as uuid } from 'uuid';
export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    default: () => uuid(),
  })
  _id!: string;

  @Prop({
    type: String,
    required: true,
  })
  fullname!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({
    type: String,
    required: true,
    minlength: 8,
  })
  password!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(UserRole),
  })
  role!: UserRole;

  @Prop({
    type: String,
    default:
      'https://res.cloudinary.com/dgagbheuj/image/upload/v1763194734/avatar-default-image_yc4xy4.jpg',
  })
  avatar!: string;

  @Prop()
  bio!: string;

  @Prop()
  balance!: number;

  @Prop()
  frozenBalance!: number;

  @Prop({
    type: String,
    enum: Object.values(VerificationStatus),
    default: VerificationStatus.PENDING,
  })
  verificationStatus!: VerificationStatus;

  @Prop()
  idCardImage!: string;

  @Prop()
  selfieImage!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
