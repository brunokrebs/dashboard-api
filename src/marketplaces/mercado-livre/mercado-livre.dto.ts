import { Allow, MaxLength, Min } from 'class-validator';
import { Product } from '../../products/entities/product.entity';

export class MLProductDTO {
  @Min(1)
  id?: number;

  @MaxLength(30)
  categoryId: string;

  @MaxLength(30)
  categoryName: string;

  @Allow()
  product: Product;
}
