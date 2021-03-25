import { Allow, IsBoolean, IsDecimal, IsNumber, Length } from 'class-validator';

export class CouponDTO {
  @Allow()
  id?: number;

  @Length(1, 20)
  code: string;

  @Length(1, 60)
  description: string;

  @Allow()
  type: string;

  @Allow()
  value?: number;

  @Allow()
  expirationDate?: Date;

  @IsBoolean()
  active: boolean;
}
