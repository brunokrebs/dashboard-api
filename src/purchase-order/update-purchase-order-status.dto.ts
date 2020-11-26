import { PurchaseOrderStatus } from './purchase-order.enum';

export class UpdatePurchaseOrderStatusDTO {
  referenceCode: string;
  status: PurchaseOrderStatus;
}
