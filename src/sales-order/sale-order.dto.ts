import { Customer } from '../customers/customer.entity';
import { SaleOrderItemDTO } from './sale-order-item.dto';
import { PaymentType } from './entities/payment-type.enum';
import { PaymentStatus } from './entities/payment-status.enum';
import { ShippingType } from './entities/shipping-type.enum';
import { SaleOrderBlingStatus } from './entities/sale-order-bling-status.enum';
import { Allow } from 'class-validator';

export class SaleOrderDTO {
  @Allow()
  id?: number;

  @Allow()
  referenceCode?: string;

  @Allow()
  customer: Customer;

  @Allow()
  items: SaleOrderItemDTO[];

  @Allow()
  total?: number;

  @Allow()
  discount: number;

  @Allow()
  paymentType: PaymentType | string;

  @Allow()
  paymentStatus: PaymentStatus | string;

  @Allow()
  installments: number;

  @Allow()
  shippingType: ShippingType | string;

  @Allow()
  shippingPrice: number;

  @Allow()
  customerName: string;

  @Allow()
  shippingStreetAddress: string;

  @Allow()
  shippingStreetNumber: string;

  @Allow()
  shippingStreetNumber2?: string;

  @Allow()
  shippingNeighborhood: string;

  @Allow()
  shippingCity: string;

  @Allow()
  shippingState: string;

  @Allow()
  shippingZipAddress: string;

  @Allow()
  creationDate?: Date;

  @Allow()
  approvalDate?: Date;

  @Allow()
  cancellationDate?: Date;

  @Allow()
  blingStatus?: SaleOrderBlingStatus | string;
}
