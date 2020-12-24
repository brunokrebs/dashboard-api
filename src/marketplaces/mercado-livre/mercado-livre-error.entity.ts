import { Product } from '../../products/entities/product.entity';
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../util/base-entity';

@Entity({
  name: 'ml_error',
})
export class MLError extends BaseEntity {
  @OneToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    name: 'error',
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  error: string;
}
