import { Allow } from 'class-validator';
import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../util/base-entity';

@Entity()
export class Supplier extends BaseEntity {
  @Column({
    name: 'cnpj',
    type: 'varchar',
    length: 14,
    unique: true,
    nullable: false,
  })
  @Allow()
  cnpj: string;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 90,
    unique: false,
    nullable: false,
  })
  @Allow()
  name: string;
}
