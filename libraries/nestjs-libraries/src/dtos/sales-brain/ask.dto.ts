import { IsDefined, IsString } from 'class-validator';

export class AskSalesBrainDto {
  @IsString()
  @IsDefined()
  question: string;
}
