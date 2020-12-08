import { Allow } from 'class-validator';
import { PurchaseOrderStatus } from './purchase-order.enum';

export class UpdatePurchaseOrderStatusDTO {
  @Allow()
  referenceCode: string;

  @Allow()
  status: PurchaseOrderStatus;
}
