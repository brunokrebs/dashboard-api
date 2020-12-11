import { Allow } from 'class-validator';

export class MLProductDTO {
  @Allow()
  categoryId: string;

  @Allow()
  productId: string;
}
