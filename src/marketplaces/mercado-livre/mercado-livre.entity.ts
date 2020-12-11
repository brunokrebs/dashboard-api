import { Product } from '../../products/entities/product.entity';
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../util/base-entity';

@Entity({
  name: 'ml_product',
})
export class MLProduct extends BaseEntity {
  @Column({
    name: 'product_id',
    type: 'integer',
    nullable: false,
  })
  product: Product;

  @Column({
    name: 'mercado_livre_id',
    type: 'varchar',
    length: 30,
    nullable: false,
  })
  mbId: string;

  @Column({
    name: 'category_id',
    type: 'varchar',
    length: 30,
    nullable: false,
  })
  category: string;

  @Column({
    name: 'need_atualization',
    type: 'boolean',
    default: false,
    nullable: true,
  })
  needAtualization: string;
}
