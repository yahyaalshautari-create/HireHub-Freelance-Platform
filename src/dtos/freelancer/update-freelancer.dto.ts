import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { JobTitle, Skills } from 'src/enums/freelancer.enum';

export class UpdateFreelancerDto {
  @IsOptional()
  @IsEnum(JobTitle, { message: 'Invalid job title' })
  jobTitle?: string;

  @IsOptional()
  @IsString({ message: 'the bio must be in text' })
  bio?: string;

  @IsOptional()
  @IsArray({ message: 'Skills should be in the form of a list' })
  @ArrayMaxSize(10, { message: 'The maximum number of skills is 10' })
  @ArrayUnique({ message: 'Skills should not contain repetition' })
  @IsEnum(Skills, {
    each: true,
    message: 'Invalid Skills',
  })
  skills?: Skills[];

  @IsOptional()
  @IsNumber({}, { message: 'the price must be in number' })
  @Min(0, { message: 'The price must be greater than or equal to 0' })
  hourlyRate?: number;
}
