import { Length } from 'class-validator';
import { ProductVariationDTO } from './product-variation.dto';
import { ProductImageDTO } from './product-image.dto';
import { ProductCategory } from '../entities/product-category.enum';

export class ProductDTO {
  @Length(3, 24)
  sku: string;

  @Length(5, 60)
  title: string;
  ncm: string;
  description?: string;
  productDetails?: string;
  sellingPrice?: number;
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
  isActive?: boolean;
  productVariations: ProductVariationDTO[];
  productComposition?: string[];
  productImages?: ProductImageDTO[];
  category?: ProductCategory | string;
}
