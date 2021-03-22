import { Allow, IsBoolean, IsDecimal, Length } from 'class-validator';

export class CouponDTO {
  @Length(1, 20)
  code: string;

  @Length(1, 30)
  description: string;

  @Allow()
  type: string;

  @IsDecimal()
  value: number;

  expirationDate?: Date;

  @IsBoolean()
  active: boolean;
}
