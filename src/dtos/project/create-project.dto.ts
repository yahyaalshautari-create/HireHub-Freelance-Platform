import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BudgetType } from 'src/enums/project.enum';

export class CreateProjectDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @IsNumber({}, { message: 'Budget must be a number' })
  @IsNotEmpty({ message: 'Budget is required' })
  budget!: number;

  @IsEnum(BudgetType, {
    message: `Budget type must be one of: ${Object.values(BudgetType).join(', ')}`,
  })
  budgetType!: BudgetType;
}
