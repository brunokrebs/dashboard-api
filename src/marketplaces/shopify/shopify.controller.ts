import { Controller, Post, Req, Res } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import crypto from 'crypto';
import cep from 'cep-promise';
import { Response, Request } from 'express';
import { PaymentType } from '../../sales-order/entities/payment-type.enum';
import { SaleOrderItemDTO } from '../../sales-order/sale-order-item.dto';
import { SaleOrderDTO } from '../../sales-order/sale-order.dto';
import { SalesOrderService } from '../../sales-order/sales-order.service';
import { PaymentStatus } from 'src/sales-order/entities/payment-status.enum';
@Controller('shopify')
export class ShopifyController {
  constructor(
    private shopifyService: ShopifyService,
    private salesOrderService: SalesOrderService,
  ) {}

  async createSaleOrder(order: any, update: boolean) {
    const customer = await this.shopifyService.verifyCustomer(order.customer);
    const salesOrderItems: SaleOrderItemDTO[] = this.shopifyService.convertSalesOrderItems(
      order.line_items,
    );
    const paymentStatus = this.shopifyService.convertPaymentStatus(
      order.financial_status,
    );
    const shippingType = this.shopifyService.convertShippingType(
      order.shipping_lines,
    );
    const address = order.shipping_address.address1.split(',');
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
      shippingStreetNumber: address[1],
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
  verifyShopifyHook(hmacShopify: string, req: Request) {
    const body = JSON.stringify(req.body);
    let digest = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_VALIDATOR)
      .update(body, 'utf8')
      .digest('base64');
    console.log(hmacShopify);
    console.log(digest);
  }
  @Post('/create-sale-order')
  async webhookCreateSaleOrde(
    @Res() resp: Response,
    @Req() req: Request,
  ): Promise<void> {
    const hmacShopify = req.get('x-shopify-hmac-sha256');
    const order = req.body;

    const saleOrder = await this.createSaleOrder(order, false);
    this.verifyShopifyHook(hmacShopify, req);
    await this.salesOrderService.save(saleOrder);
    resp.send('OK');
  }

  @Post('/update-sale-order')
  async updateSaleOrde(@Res() resp: Response, @Req() req: Request) {
    const order = req.body;
    const saleOrder = await this.createSaleOrder(order, true);
    console.log(order);
    if (order.cancelled_at !== null) {
      await this.salesOrderService.updateStatus(
        order.id,
        PaymentStatus.CANCELLED,
      );
    } else {
      await this.salesOrderService.save(saleOrder);
    }
    resp.send('OK');
  }
}
