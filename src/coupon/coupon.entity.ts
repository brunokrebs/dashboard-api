import { BaseEntity } from '../util/base-entity';
import { Entity, Column } from 'typeorm';
import { Allow, IsBoolean, IsDecimal } from 'class-validator';

@Entity()
export class Coupon extends BaseEntity {
  @Allow()
  @Column({
    name: 'code',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: false,
  })
  code: string;

  @Allow()
  @Column({
    name: 'type',
    type: 'varchar',
    length: 10,
    unique: false,
    nullable: false,
  })
  type: string;

  @Allow()
  @Column({
    name: 'description',
    type: 'varchar',
    length: 30,
    unique: false,
    nullable: true,
  })
  description: string;

  @IsDecimal()
  @Column({
    name: 'value',
    type: 'decimal',
    unique: false,
    nullable: true,
  })
  value: number;

  @IsBoolean()
  @Column({
    name: 'active',
    type: 'boolean',
    unique: false,
    nullable: false,
  })
  active: boolean;

  @Column({
    name: 'expiration_date',
    type: 'date',
    unique: false,
    nullable: false,
  })
  expirationDate?: Date;
}
