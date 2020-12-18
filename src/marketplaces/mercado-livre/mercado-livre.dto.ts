import { Allow, MaxLength, Min } from 'class-validator';

export class MLProductDTO {
  @MaxLength(30)
  categoryId: string;

  @MaxLength(30)
  categoryName: string;

  @MaxLength(24)
  sku: string;
}
