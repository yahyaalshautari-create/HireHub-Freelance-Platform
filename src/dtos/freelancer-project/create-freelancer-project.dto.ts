import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFreelancerProjectDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @IsOptional()
  @IsString({ message: 'Link demo must be a string' })
  linkDemo?: string;
}
