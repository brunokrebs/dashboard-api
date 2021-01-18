import { Allow, MaxLength, Min, MinLength, IsBoolean } from 'class-validator';
import { Product } from '../../products/entities/product.entity';

export class MLAdDTO {
  @Min(1)
  id?: number;

  @MaxLength(30)
  categoryId?: string;

  @MaxLength(30)
  categoryName?: string;

  @MinLength(4)
  @MaxLength(15)
  adType?: string;

  @Allow()
  product?: Product;

  @IsBoolean()
  isSynchronized?: boolean;

  @Allow()
  additionalPrice?: number;
}
