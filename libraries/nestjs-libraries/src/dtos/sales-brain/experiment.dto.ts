import { IsDefined, IsString } from 'class-validator';

export class CreateExperimentDto {
  @IsString()
  @IsDefined()
  name: string;

  @IsString()
  @IsDefined()
  variantAContent: string;

  @IsString()
  @IsDefined()
  variantBContent: string;
}
