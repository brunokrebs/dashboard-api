import { Supplier } from '../supplier/supplier.entity';
import { NumericTransformer } from '../util/numeric-transformer';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../util/base-entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchaseOrderStatus } from './purchase-order.enum';
import { Allow } from 'class-validator';

@Entity()
export class PurchaseOrder extends BaseEntity {
  @Column({
    name: 'reference_code',
    type: 'varchar',
    length: 36,
    unique: true,
    nullable: false,
  })
  @Allow()
  referenceCode: string;

  @Column({
    name: 'creation_date',
    type: 'timestamp',
    unique: false,
    nullable: true,
  })
  @Allow()
  creationDate?: Date;

  @Column({
    name: 'completion_date',
    type: 'timestamp',
    unique: false,
    nullable: true,
  })
  @Allow()
  completionDate?: Date;

  @ManyToOne(type => Supplier, {
    nullable: false,
    cascade: false,
  })
  @Allow()
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @OneToMany(
    type => PurchaseOrderItem,
    item => item.purchaseOrder,
    { persistence: false },
  )
  @Allow()
  items: PurchaseOrderItem[];

  @Column({
    name: 'discount',
    precision: 2,
    nullable: false,
    transformer: new NumericTransformer(),
  })
  @Allow()
  discount: number;

  @Column({
    name: 'shipping_price',
    precision: 2,
    nullable: false,
    transformer: new NumericTransformer(),
  })
  @Allow()
  shippingPrice: number;

  @Column({
    name: 'total',
    precision: 2,
    transformer: new NumericTransformer(),
  })
  @Allow()
  total?: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 60,
  })
  @Allow()
  status?: PurchaseOrderStatus;
}
