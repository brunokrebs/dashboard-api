import { Injectable } from '@nestjs/common';
import Shopify, { IProductVariant } from 'shopify-api-node';
import { Product } from '../../products/entities/product.entity';
import { categoryDescription } from '../../products/entities/product-category.enum';
import { ProductsService } from '../../products/products.service';
import { Cron } from '@nestjs/schedule';
import { SaleOrderDTO } from '../../sales-order/sale-order.dto';
import { SaleOrderItemDTO } from '../../sales-order/sale-order-item.dto';
import { SalesOrderService } from '../../sales-order/sales-order.service';
import { Customer } from '../../customers/customer.entity';
import { CustomersService } from 'src/customers/customers.service';
import { PaymentType } from 'src/sales-order/entities/payment-type.enum';
import { PaymentStatus } from 'src/sales-order/entities/payment-status.enum';
import { ShippingType } from 'src/sales-order/entities/shipping-type.enum';
@Injectable()
export class ShopifyService {
  private shopify: Shopify;

  constructor(
    private productsService: ProductsService,
    private salesOrderService: SalesOrderService,
    private customerService: CustomersService,
  ) {
    this.shopify = new Shopify({
      shopName: process.env.SHOPIFY_NAME,
      apiKey: process.env.SHOPIFY_API_KEY,
      password: process.env.SHOPIFY_PASSWORD,
    });
  }

  async syncProduct(product: Product) {
    // 1. map product to shopify structure
    const shopifyProduct = {
      sku: product.sku,
      metafields_global_title_tag: product.title,
      metafields_global_description_tag: product.description,
      title: product.title,
      body_html: product.productDetails,
      vendor: 'Frida Kahlo',
      product_type: categoryDescription(product.category),
      images: product.productImages.map(image => ({
        src: image.image.originalFileURL,
      })),
      status: product.isActive ? 'active' : 'archived',
      published: product.isActive,
      variants: product.productVariations.map(variation => ({
        option1: variation.description,
        price: product.sellingPrice,
        sku: variation.sku,
        inventory_management: 'shopify',
      })),
    };

    // 2. persist on Shopify
    let response;
    if (product.shopifyId) {
      response = await this.shopify.product.update(
        product.shopifyId,
        shopifyProduct,
      );
    } else {
      response = await this.shopify.product.create(shopifyProduct);
      product.shopifyId = response.id;
      await this.productsService.updateProductProperties(product.id, {
        shopifyId: response.id,
      });
    }

    // 3. fill product variations with shopify ids
    response.variants.forEach((variant: IProductVariant) => {
      const productVariation = product.productVariations.find(
        pv => variant.sku === pv.sku,
      );
      productVariation.shopifyId = variant.id;
      productVariation.shopifyInventoryId = variant.inventory_item_id;
    });
  }

  @Cron('0 */10 * * *')
  async syncProducts() {
    const products = await this.productsService.findAll();
    console.log(`${products.length} produtos encontrados`);

    const syncJobs = products.map((product, idx) => {
      return new Promise(res => {
        setTimeout(async () => {
          await this.syncProduct(product);
          console.log(`${idx} - ${product.sku} sincronizado`);
          res();
        }, idx * 550);
      });
    });
    await Promise.all(syncJobs);

    console.log('finished updating product information');
    console.log('starting to update inventory');

    const allVariations = products.flatMap(product => {
      const { productVariations } = product;
      return [...productVariations];
    });
    allVariations.map((pv, idx) => {
      return new Promise(res => {
        setTimeout(async () => {
          // 4. save shopify ids
          try {
            await this.productsService.updateVariationProperty(pv.id, {
              shopifyId: pv.shopifyId,
              shopifyInventoryId: pv.shopifyInventoryId,
            });

            // 5. update inventory on Shopify
            await this.shopify.inventoryLevel.set({
              location_id: process.env.SHOPIFY_LOCATION_ID,
              inventory_item_id: parseInt(pv.shopifyInventoryId.toString()),
              available: pv.currentPosition,
            });
            console.log(`${pv.sku} inventory updated on shopify`);
            res();
          } catch (error) {
            console.log(pv.sku);
          }
        }, 550 * idx);
      });
    });
    await Promise.all(allVariations);
    console.log('finished updating inventory');
  }

  async syncOrders() {
    await this.shopify.order
      .list({ limit: 5 })
      .then(orders => {
        const transactions = orders.map(async order => {
          await this.syncOrder(order);
        });

        return { orders, transactions };
      })
      .catch(err => console.error(err));
  }

  async syncOrder(order: Shopify.IOrder) {
    let existingCustomer: Customer = await this.customerService.findByEmail(
      order.customer.email,
    );

    if (!existingCustomer) {
      const customer: Customer = {
        cpf: null,
        email: order.customer.email,
        name: order.shipping_address.name,
        //id: 4183801462946,
      };
      existingCustomer = await this.customerService.save(customer);
    }

    const salesOrderItems: SaleOrderItemDTO[] = this.convertSalesOrderItems(
      order.line_items,
    );
    const paymentStatus = this.convertPaymentStatus(order.financial_status);
    const shippingType = this.convertShippingType(order.shipping_lines);
    const adress = order.shipping_address.address1.split(',');

    const saleOrder: SaleOrderDTO = {
      referenceCode: order.id.toString(),
      customer: existingCustomer,
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
      shippingStreetAddress: adress[0],
      shippingStreetNumber: adress[1],
      shippingStreetNumber2: order.shipping_address.address2,
      shippingNeighborhood: null,
      shippingCity: order.shipping_address.city,
      shippingState: order.shipping_address.province,
      shippingZipAddress: order.shipping_address.zip,
    };
    console.log(this.salesOrderService.save(saleOrder));
  }

  private convertPaymentStatus(status: string) {
    switch (status) {
      case 'pending':
        return PaymentStatus.IN_PROCESS;
      case 'authorized':
        return PaymentStatus.APPROVED;
      case 'partially_paid':
        return PaymentStatus.IN_PROCESS;
      case 'paid':
        return PaymentStatus.APPROVED;
      case 'partially_refunded:':
        return PaymentStatus.CANCELLED;
      case 'refunded':
        return PaymentStatus.CANCELLED;
      case 'voided':
        return PaymentStatus.CANCELLED;
    }
  }

  private convertShippingType(shippingLines: Shopify.IOrderShippingLine[]) {
    return ShippingType.PAC;
  }

  private convertSalesOrderItems(items: Shopify.IOrderLineItem[]) {
    const allItems: SaleOrderItemDTO[] = items.map(item => {
      return {
        sku: item.sku,
        completeDescription: item.variant_title,
        price: Number.parseFloat(item.price),
        amount: item.quantity,
        discount: Number.parseInt(item.total_discount),
      };
    });
    return allItems;
  }
}
