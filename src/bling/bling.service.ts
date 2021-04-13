import { Injectable, HttpService } from '@nestjs/common';
import { j2xParser as XMLParser } from 'fast-xml-parser';
import moment from 'moment';
import qs from 'qs';

import { SaleOrder } from '../sales-order/entities/sale-order.entity';
import { PaymentStatus } from '../sales-order/entities/payment-status.enum';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { Product } from '../products/entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class BlingService {
  parser = new XMLParser({});

  constructor(
    private httpService: HttpService,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private inventoryService: InventoryService,
  ) {}

  async removeProduct(productVariation: ProductVariation): Promise<any> {
    const data = {
      apikey: process.env.BLING_APIKEY,
    };

    return this.httpService.delete(
      `https://bling.com.br/Api/v2/produto/${productVariation.sku}`,
      {
        data: qs.stringify(data),
      },
    );
  }
  private formatImageUrlToBling(product: Product) {
    return product.productImages.map(pi => {
      const image = pi.image.originalFileURL.replace(
        'https://s3.sa-east-1.amazonaws.com/',
        'https://',
      );
      return { url: image };
    });
  }
  createOrUpdateProduct(product: Product): Promise<any> {
    const images = this.formatImageUrlToBling(product);
    return this.pushProductToBling(product);
  }

  createOrUpdateProductVariation(
    productVariation: ProductVariation,
  ): Promise<any> {
    let descricao = productVariation.product.title;
    if (productVariation.description !== 'Tamanho Único') {
      descricao = `${descricao} ${productVariation.description}`;
    }
    const images = this.formatImageUrlToBling(productVariation.product);

    return this.pushItemToBling(
      descricao,
      productVariation.sku,
      productVariation.product.ncm,
      productVariation.sellingPrice,
      productVariation.currentPosition,
    );
  }

  private pushProductToBling(product: Product) {
    const images = this.formatImageUrlToBling(product);

    let formatedProduct: any = {
      produto: {
        codigo: product.sku,
        descricao: product.title,
        class_fiscal: product.ncm,
        un: 'Un',
        vlr_unit: product.sellingPrice,
        estoque: product.productVariations[0].currentPosition || 0,
        imagens: images || null,
        origem: 0,
      },
    };

    if (product.variationsSize > 1) {
      const variations = product.productVariations.map(pv => {
        let description = product.title;
        if (pv.description !== 'Tamanho Único') {
          description = `${description} ${pv.description}`;
        }
        return {
          variacao: {
            nome: pv.description,
            codigo: pv.sku,
            vlr_unit: pv.sellingPrice,
            estoque: pv.currentPosition,
            clonarDadosPai: 'S',
          },
        };
      });
      formatedProduct.produto = {
        ...formatedProduct.produto,
        variacoes: variations,
      };
    }

    const xml = this.parser.parse(formatedProduct);
    console.log(xml);
    const data = {
      xml: xml,
      apikey: process.env.BLING_APIKEY,
    };

    return this.httpService
      .post('https://bling.com.br/Api/v2/produto/json/', qs.stringify(data))
      .toPromise();
  }

  private pushItemToBling(
    descricao: string,
    sku: string,
    ncm: string,
    sellingPrice: number,
    currentPosition?: number,
    images?: any[],
    haveVariation?: boolean,
  ) {
    let product = {
      produto: {
        codigo: sku,
        descricao: descricao,
        class_fiscal: ncm,
        un: 'Un',
        vlr_unit: sellingPrice,
        estoque: currentPosition || 0,
        imagens: images || null,
        origem: 0,
      },
    };
    const xml = this.parser.parse(product);
    console.log(xml);
    const data = {
      xml: xml,
      apikey: process.env.BLING_APIKEY,
    };

    return this.httpService
      .post('https://bling.com.br/Api/v2/produto/json/', qs.stringify(data))
      .toPromise();
  }

  async createPurchaseOrder(saleOrder: SaleOrder): Promise<any> {
    const env = process.env.NODE_ENV;
    if (env === 'development' || env === 'test') return Promise.resolve();

    if (saleOrder.paymentDetails.paymentStatus !== PaymentStatus.APPROVED) {
      throw new Error(
        'We should only create purchase orders that have payment approved.',
      );
    }

    const { customer, shipmentDetails, items } = saleOrder;

    const order = {
      numero: saleOrder.referenceCode,
      cliente: {
        nome: customer.name,
        fone: customer.phoneNumber,
        cpf_cnpj: customer.cpf,
        email: customer.email,
        tipoPessoa: 'F',
        endereco: customer.streetAddress,
        numero: customer.streetNumber,
        complemento: customer.streetNumber2,
        bairro: customer.neighborhood,
        cep: customer.zipAddress,
        cidade: customer.city,
        uf: customer.state,
      },
      transporte: {
        transportadora: shipmentDetails.shippingType,
        tipo_frete: 'D',
        servico_correios: shipmentDetails.shippingType,
        dados_etiqueta: {
          nome: shipmentDetails.customerName,
          endereco: shipmentDetails.shippingStreetAddress,
          numero: shipmentDetails.shippingStreetNumber,
          complemento: shipmentDetails.shippingStreetNumber2,
          municipio: shipmentDetails.shippingCity,
          uf: shipmentDetails.shippingState,
          cep: shipmentDetails.shippingZipAddress,
          bairro: shipmentDetails.shippingNeighborhood,
        },
        volumes: [
          {
            volume: {
              servico: shipmentDetails.shippingType,
            },
          },
        ],
      },
      itens: [],
      parcelas: [],
      vlr_frete: shipmentDetails.shippingPrice,
      vlr_desconto: saleOrder.paymentDetails.discount,
    };

    items.forEach(item => {
      const finalPrice = item.price - item.discount;
      const itemSold = {
        item: {
          codigo: item.productVariation.sku,
          descricao: item.productVariation.product.title,
          un: 'Un',
          qtde: item.amount,
          vlr_unit: finalPrice,
        },
      };
      if (item.productVariation.description) {
        itemSold.item.descricao += ` - Tamanho ${item.productVariation.description}`;
      }
      order.itens.push(itemSold);
    });

    for (let i = 0; i < saleOrder.paymentDetails.installments; i++) {
      const installmentDate = moment().add(i, 'M');
      order.parcelas.push({
        parcela: {
          data: installmentDate.format('DD/MM/YYYY'),
          vlr:
            saleOrder.paymentDetails.total /
            saleOrder.paymentDetails.installments,
        },
      });
    }

    const xml = this.parser.parse({
      pedido: order,
    });

    const data = {
      xml: xml.replace(/&/g, '&amp;'),
      apikey: process.env.BLING_APIKEY,
    };

    const syncRequest = await this.httpService.post(
      'https://bling.com.br/Api/v2/pedido/json/',
      qs.stringify(data),
    );

    const response = await syncRequest.toPromise();

    if (
      response.data?.retorno?.erros &&
      response.data.retorno.erros.length > 0
    ) {
      throw new Error('Unable to sync sale order with Bling.');
    }
    return Promise.resolve(response);
  }

  async cancelPurchaseOrder(saleOrder: SaleOrder): Promise<any> {
    const xml = this.parser.parse({
      pedido: {
        idSituacao: 12, // more info: https://ajuda.bling.com.br/hc/pt-br/articles/360046304394-GET-situacao-m%C3%B3dulo-
      },
    });

    const data = {
      xml: xml,
      apikey: process.env.BLING_APIKEY,
    };

    console.log(`Cancelling order ${saleOrder.referenceCode} on Bling.`);

    return this.httpService
      .put(
        `https://bling.com.br/Api/v2/pedido/${saleOrder.referenceCode}/json/`,
        qs.stringify(data),
      )
      .toPromise();
  }

  async updateProductsOnBling(
    allProducts: Product[],
    allProductVariations: ProductVariation[],
  ) {
    const updateParentProductsJobs = allProducts
      .filter(p => p.productVariations.length > 1)
      .map((p, idx) => {
        return new Promise<void>(res => {
          setTimeout(async () => {
            try {
              await this.createOrUpdateProduct(p);
            } catch (e) {
              console.error(e);
            }
            res();
          }, 200 * idx);
        });
      });
    await Promise.all(updateParentProductsJobs);

    const updateVariationsJobs = allProductVariations.map((pv, idx) => {
      return new Promise<void>(res => {
        setTimeout(async () => {
          try {
            await this.createOrUpdateProductVariation(pv);
          } catch (e) {
            console.error(e);
          }
          res();
        }, 200 * idx);
      });
    });
    await Promise.all(updateVariationsJobs);
  }

  async loadPurchaseOrders() {
    const today = moment().format('DD/MM/YYYY');
    const sevenDaysAgo = moment()
      .subtract(60, 'days')
      .format('DD/MM/YYYY');
    const loadRequest = await this.httpService.get(
      `https://bling.com.br/Api/v2/pedidoscompra/json/?filters=dataEmissao[${sevenDaysAgo} TO ${today}]; situacao[1]&apikey=${process.env.BLING_APIKEY}`,
    );

    try {
      const response = await loadRequest.toPromise();

      if (!response?.data?.retorno?.pedidoscompra) {
        throw new Error('Error while loading purchase orders from Bling.');
      }

      return response.data.retorno.pedidoscompra.flatMap(item => {
        return item.map(pc => {
          return pc.pedidocompra;
        });
      });
    } catch (e) {
      console.log(e);
    }
  }

  async insertAllProductsOnBling() {
    const products = await this.getAllProducts();
    const insertProductsJobs = products
      .filter(p => p.variationsSize === 10)
      .map((p, idx) => {
        return new Promise<void>(res => {
          setTimeout(async () => {
            try {
              await this.createOrUpdateProduct(p);
            } catch (e) {
              console.error(e);
            }
            res();
          }, 200 * idx);
        });
      });
    await Promise.all(insertProductsJobs);
  }
  async getAllProducts() {
    const products = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productVariations', 'pv')
      .leftJoinAndSelect('product.productImages', 'pi')
      .leftJoinAndSelect('pi.image', 'i')
      .getMany();

    /* const productVariations: ProductVariation[] = products.reduce(
      (variations, product) => {
        variations.push(...product.productVariations);
        return variations;
      },
      [],
    );

    for (const variation of productVariations) {
      const inventory = await this.inventoryService.findBySku(variation.sku);
      variation.currentPosition = inventory.currentPosition || 0;
    } */
    return Promise.resolve(products);
  }
}
