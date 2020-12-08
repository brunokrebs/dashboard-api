import { Allow, Length } from 'class-validator';
import { ProductVariationDTO } from './product-variation.dto';
import { ProductImageDTO } from './product-image.dto';
import { ProductCategory } from '../entities/product-category.enum';

export class ProductDTO {
  @Length(3, 24)
  sku: string;

  @Length(5, 60)
  title: string;

  @Allow()
  ncm: string;

  @Allow()
  description?: string;

  @Allow()
  productDetails?: string;

  @Allow()
  sellingPrice?: number;

  @Allow()
  height?: number;

  @Allow()
  width?: number;

  @Allow()
  length?: number;

  @Allow()
  weight?: number;

  @Allow()
  isActive?: boolean;

  @Allow()
  productVariations: ProductVariationDTO[];

  @Allow()
  productComposition?: string[];

  @Allow()
  productImages?: ProductImageDTO[];

  @Allow()
  category?: ProductCategory | string;

  @Allow()
  isComposition?: boolean;
}
