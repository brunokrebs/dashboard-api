import { BaseEntity } from '../util/base-entity';
import { Entity, Column } from 'typeorm';
import { Allow } from 'class-validator';

@Entity()
export class Customer extends BaseEntity {
  @Allow()
  @Column({
    name: 'cpf',
    type: 'varchar',
    length: 11,
    unique: true,
    nullable: false,
  })
  cpf: string;

  @Allow()
  @Column({
    name: 'name',
    type: 'varchar',
    length: 60,
    unique: false,
    nullable: false,
  })
  name: string;

  @Allow()
  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 24,
    unique: false,
    nullable: true,
  })
  phoneNumber?: string;

  @Allow()
  @Column({
    name: 'email',
    type: 'varchar',
    length: 60,
    unique: false,
    nullable: true,
  })
  email?: string;

  @Allow()
  @Column({
    name: 'birthday',
    type: 'date',
    unique: false,
    nullable: true,
  })
  birthday?: Date | string;

  @Allow()
  @Column({
    name: 'zip_address',
    type: 'varchar',
    length: 8,
    unique: false,
    nullable: true,
  })
  zipAddress?: string;

  @Allow()
  @Column({
    name: 'state',
    type: 'varchar',
    length: 2,
    unique: false,
    nullable: true,
  })
  state?: string;

  @Allow()
  @Column({
    name: 'city',
    type: 'varchar',
    length: 30,
    unique: false,
    nullable: true,
  })
  city?: string;

  @Allow()
  @Column({
    name: 'neighborhood',
    type: 'varchar',
    length: 30,
    unique: false,
    nullable: true,
  })
  neighborhood?: string;

  @Allow()
  @Column({
    name: 'street_address',
    type: 'varchar',
    length: 50,
    unique: false,
    nullable: true,
  })
  streetAddress?: string;

  @Allow()
  @Column({
    name: 'street_number',
    type: 'varchar',
    length: 10,
    unique: false,
    nullable: true,
  })
  streetNumber?: string;

  @Allow()
  @Column({
    name: 'street_number2',
    type: 'varchar',
    length: 20,
    unique: false,
    nullable: true,
  })
  streetNumber2?: string;
}
