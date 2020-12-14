import { Allow, Min } from 'class-validator';

export class MLProductDTO {
  @Allow()
  categoryId: string;

  @Allow()
  thumbnail: string;

  @Allow()
  sku: string;

  @Allow()
  title: string;

  @Allow()
  @Min(0.0001)
  maxPrice: number;

  @Allow()
  isMLProduct: boolean;
}
