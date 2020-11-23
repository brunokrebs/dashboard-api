import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { ProductVariation } from '../products/entities/product-variation.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { BaseEntity } from '../util/base-entity';
import { NumericTransformer } from '../util/numeric-transformer';

@Entity()
export class PurchaseOrderItem extends BaseEntity {
  @ManyToOne(type => ProductVariation, {
    nullable: false,
    cascade: false,
  })
  @JoinColumn({ name: 'product_variation_id' })
  productVariation: ProductVariation;

  @ManyToOne(type => PurchaseOrder, {
    nullable: false,
  })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder?: PurchaseOrder;

  @Column({
    name: 'price',
    precision: 2,
    nullable: false,
    transformer: new NumericTransformer(),
  })
  price: number;

  @Column({
    name: 'amount',
    precision: 2,
    nullable: false,
    transformer: new NumericTransformer(),
  })
  amount: number;

  // as decimal (e.g., 15% must be persisted as 0.15)
  @Column({
    name: 'ipi',
    precision: 6,
    nullable: false,
    transformer: new NumericTransformer(),
  })
  ipi: number;
}
