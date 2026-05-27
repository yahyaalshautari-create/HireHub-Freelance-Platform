import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString({ message: 'The sender ID must be in string' })
  @IsNotEmpty({ message: 'Sender ID is required' })
  receiverId!: string;

  @IsOptional()
  @IsString({ message: 'The content must be in text' })
  content?: string;
}
