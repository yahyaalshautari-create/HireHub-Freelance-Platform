import { IsOptional, IsString } from 'class-validator';

export class UpdateFreelancerProjectDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Link demo must be a string' })
  linkDemo?: string;
}
