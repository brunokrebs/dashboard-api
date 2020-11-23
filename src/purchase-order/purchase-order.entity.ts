import { Supplier } from '../supplier/supplier.entity';
import { NumericTransformer } from '../util/numeric-transformer';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../util/base-entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

@Entity()
export class PurchaseOrder extends BaseEntity {
  @Column({
    name: 'reference_code',
    type: 'varchar',
    length: 36,
    unique: true,
    nullable: false,
  })
  referenceCode: string;

  @Column({
    name: 'creation_date',
    type: 'timestamp',
    unique: false,
    nullable: true,
  })
  creationDate?: Date;

  @Column({
    name: 'completion_date',
    type: 'timestamp',
    unique: false,
    nullable: true,
  })
  completionDate?: Date;

  @ManyToOne(type => Supplier, {
    nullable: false,
    cascade: false,
  })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @OneToMany(
    type => PurchaseOrderItem,
    item => item.purchaseOrder,
    { persistence: false },
  )
  items: PurchaseOrderItem[];

  @Column({
    name: 'discount',
    precision: 2,
    nullable: false,
    transformer: new NumericTransformer(),
  })
  discount: number;

  @Column({
    name: 'shipping_price',
    precision: 2,
    nullable: false,
    transformer: new NumericTransformer(),
  })
  shippingPrice: number;

  @Column({
    name: 'total',
    precision: 2,
    transformer: new NumericTransformer(),
  })
  total?: Number;
}
