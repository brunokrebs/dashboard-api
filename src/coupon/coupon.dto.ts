import { Allow, IsBoolean, IsDecimal, IsNumber, Length } from 'class-validator';

export class CouponDTO {
  @IsNumber()
  id?: number;

  @Length(1, 20)
  code: string;

  @Length(1, 30)
  description: string;

  @Length(1, 10)
  type: string;

  @Allow()
  value?: number;

  @Allow()
  expirationDate?: Date;

  @IsBoolean()
  active: boolean;
}
