import { Product } from '../../products/entities/product.entity';
import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../util/base-entity';
import { profile } from 'console';

@Entity({
  name: 'ml_ad',
})
export class MLProduct extends BaseEntity {
  @ManyToOne(
    () => Product,
    product => product.id,
  )
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
    name: 'ad_type',
    type: 'varchar',
    length: 15,
  })
  adType: string;

  @Column({
    name: 'need_atualization',
    type: 'boolean',
    default: false,
    nullable: true,
  })
  needAtualization?: boolean;

  @Column({
    name: 'is_synchronized',
    type: 'boolean',
    default: false,
    nullable: true,
  })
  isSynchronized?: boolean;

  @Column({
    name: 'is_active',
    type: 'boolean',
  })
  isActive?: boolean;
}
