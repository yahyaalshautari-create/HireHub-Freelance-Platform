import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateProposalDto {
  @IsString({ message: 'Cover letter must be a string' })
  @IsNotEmpty({ message: 'Cover Letter is required' })
  coverLetter!: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @IsNotEmpty({ message: 'Price is required' })
  @Min(25, { message: 'Price must be at least $25' })
  price!: number;

  @IsNumber({}, { message: 'Duration must be a number' })
  @IsNotEmpty({ message: 'Duration is required' })
  @Min(1, { message: 'Duration must be at least 1 day' })
  durationDays!: number;
}
