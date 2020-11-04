import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import cep from 'cep-promise';
import { Response, Request } from 'express';
import { PaymentType } from '../../sales-order/entities/payment-type.enum';
import { SaleOrderItemDTO } from '../../sales-order/sale-order-item.dto';
import { SaleOrderDTO } from '../../sales-order/sale-order.dto';
import { SalesOrderService } from '../../sales-order/sales-order.service';
import { PaymentStatus } from '../../sales-order/entities/payment-status.enum';
import { ShopifyGuard } from './shopify.guard';

@Controller('shopify')
@UseGuards(ShopifyGuard)
export class ShopifyController {
  constructor(
    private shopifyService: ShopifyService,
    private salesOrderService: SalesOrderService,
  ) {}

  @Post('/create-sale-order')
  async createSaleOrde(
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<void> {
    const order = JSON.parse(req.body);
    console.log(order);
    const saleOrder = await this.createSaleOrder(order, false);
    await this.salesOrderService.save(saleOrder);
    res.send('OK');
  }

  @Post('/update-sale-order')
  async updateSaleOrde(@Res() res: Response, @Req() req: Request) {
    const order = JSON.parse(req.body);
    if (order.cancelled_at) {
      await this.salesOrderService.updateStatus(
        order.id,
        PaymentStatus.CANCELLED,
      );
    } else {
      const saleOrder = await this.createSaleOrder(order, true);
      await this.salesOrderService.save(saleOrder);
    }
    res.send('OK');
  }

  private async createSaleOrder(order: any, update: boolean) {
    const customer = await this.shopifyService.existingCustomer(
      order.customer,
      order.default_address.company,
    );
    const salesOrderItems: SaleOrderItemDTO[] = this.shopifyService.salesOrderItems(
      order.line_items,
    );
    const paymentStatus = this.shopifyService.convertPaymentStatus(
      order.financial_status,
    );
    const shippingType = this.shopifyService.convertShippingType(
      order.shipping_lines,
    );
    const address = order.shipping_address.address1.split(',');
    const number = order.shipping_address.address1.replace(/\D/gim, '');
    const addressNeighborhood = await cep(
      order.shipping_address.zip.replace(/\D/g, ''),
    );
    const shippingNeighborhood = addressNeighborhood.neighborhood;

    let saleOrder: SaleOrderDTO = {
      referenceCode: order.id.toString(),
      customer: customer,
      items: salesOrderItems,
      installments: 1,
      total:
        Number.parseFloat(order.total_price) +
        Number.parseFloat(order.total_discounts),
      discount: Number.parseFloat(order.total_discounts),
      paymentType: PaymentType.CREDIT_CARD,
      paymentStatus,
      shippingType,
      shippingPrice: Number.parseFloat(
        order.total_shipping_price_set.shop_money.amount.toString(),
      ),
      customerName: order.shipping_address.name,
      shippingStreetAddress: address[0],
      shippingStreetNumber: number,
      shippingStreetNumber2: order.shipping_address.address2,
      shippingNeighborhood,
      shippingCity: order.shipping_address.city,
      shippingState: order.shipping_address.province_code,
      shippingZipAddress: order.shipping_address.zip,
    };

    if (update) {
      const existingSaleOrder = await this.salesOrderService.getByReferenceCode(
        order.id.toString(),
      );

      saleOrder = {
        id: existingSaleOrder.id,
        ...saleOrder,
      };
    }
    return saleOrder;
  }
}
