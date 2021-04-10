import { Injectable } from '@nestjs/common';
import Shopify, { IProductVariant } from 'shopify-api-node';
import { Product } from '../../products/entities/product.entity';
import { categoryDescription } from '../../products/entities/product-category.enum';
import { ProductsService } from '../../products/products.service';
import { Cron } from '@nestjs/schedule';
import { sendSlackAlert } from '../../util/slack-alert';

@Injectable()
export class ShopifyService {
  private shopify: Shopify;

  constructor(private productsService: ProductsService) {
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
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    )
      return;
    const products = await this.productsService.findAll();
    console.log(`${products.length} produtos encontrados`);

    const syncJobs = products.map((product, idx) => {
      return new Promise<void>(res => {
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
      return new Promise<void>(res => {
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
            sendSlackAlert('Falha ao atualizar o estoque no shopify');
          }
        }, 550 * idx);
      });
    });
    await Promise.all(allVariations);
    console.log('finished updating inventory');
  }
}
