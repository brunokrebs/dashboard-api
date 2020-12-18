import { Product } from '../../products/entities/product.entity';
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../util/base-entity';
import { profile } from 'console';

@Entity({
  name: 'ml_product',
})
export class MLProduct extends BaseEntity {
  @OneToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    name: 'mercado_livre_id',
    type: 'varchar',
    length: 30,
    nullable: false,
  })
  mercadoLivreId?: string;

  @Column({
    name: 'category_id',
    type: 'varchar',
    length: 30,
    nullable: false,
  })
  categoryId: string;

  @Column({
    name: 'category_name',
    type: 'varchar',
    length: 30,
    nullable: false,
  })
  categoryName: string;

  @Column({
    name: 'need_atualization',
    type: 'boolean',
    default: false,
    nullable: true,
  })
  needAtualization?: string;
}
