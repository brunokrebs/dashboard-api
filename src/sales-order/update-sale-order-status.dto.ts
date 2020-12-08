import { IsNotEmpty } from 'class-validator';

export class UpdateSaleOrderStatusDTO {
  @IsNotEmpty()
  status: string;
}
