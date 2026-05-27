import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CompanyName } from 'src/enums/client.enum';

export class UpdateClientDto {
  @IsOptional()
  @IsEnum(CompanyName, { message: 'Invalid company name' })
  companyName?: CompanyName;

  @IsOptional()
  @IsString({ message: 'the bio must be in text' })
  bio?: string;
}
