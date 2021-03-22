import { Allow, IsBoolean, IsDecimal, Length } from 'class-validator';

export class CoupontDTO {
  @Length(1, 20)
  code: string;

  @Length(1, 120)
  description: string;

  @Allow()
  type: string;

  @IsDecimal()
  value: number;

  expirationDate?: Date | string;

  @IsBoolean()
  active: boolean;
}
