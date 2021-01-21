import { Allow, IsOptional, MaxLength, Min, MinLength } from 'class-validator';
import { Product } from '../../products/entities/product.entity';

export class CreateMLAdsDTO {
  @MaxLength(30)
  categoryId?: string;

  @MaxLength(30)
  categoryName?: string;

  @MinLength(4)
  @MaxLength(15)
  adType?: string;

  @Allow()
  products: Partial<Product>[];

  @IsOptional()
  @Min(0)
  additionalPrice = 0;
}
