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
import { ProductComposition } from '../products/entities/product-composition.entity';
import { PaymentType } from '../sales-order/entities/payment-type.enum';
import { Cron } from '@nestjs/schedule';
import { isEqual, uniqBy, uniqWith } from 'lodash';

@Injectable()
export class BlingService {
  parser = new XMLParser({});

  constructor(
    private httpService: HttpService,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductComposition)
    private productsCompositionRepository: Repository<ProductComposition>,
    @InjectRepository(SaleOrder)
    private saleOrderRepository: Repository<SaleOrder>,
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

  private sendProductToBling(xml: string) {
    const data = {
      xml,
      apikey: process.env.BLING_APIKEY,
    };

    return this.httpService
      .post('https://bling.com.br/Api/v2/produto/json/', qs.stringify(data))
      .toPromise();
  }

  private formatImageUrlToBling(product: Product) {
    let images = product.productImages.map(pi => {
      const image = pi.image.originalFileURL.replace(
        'https://s3.sa-east-1.amazonaws.com/',
        'https://',
      );
      return { image, order: pi.order };
    });
    const newOrderImages = images
      .sort((pi1, pi2) => pi1.order - pi2.order)
      .reverse()
      .map(pi => pi.image);
    return newOrderImages;
  }
  async createOrUpdateProduct(product: Product): Promise<any> {
    const images = this.formatImageUrlToBling(product);
    if (product.variationsSize > 1)
      return this.pushProductWithVariationToBling(product, images);
    if (product.isComposition)
      return this.pushCompositionProductToBling(product, images);
    return this.pushProductToBling(product, images);
  }

  private pushProductToBling(product: Product, images: Object[]) {
    const currentPosition =
      product.productVariations[0].currentPosition < 0
        ? 0
        : product.productVariations[0].currentPosition;
    const xml =
      product.category !== 'ACESSORIOS'
        ? this.parser.parse({
            produto: {
              codigo: product.sku,
              descricao: product.title,
              class_fiscal: product.ncm,
              un: 'Un',
              vlr_unit: product.sellingPrice,
              estoque: currentPosition,
              imagens: { url: images } || null,
              altura: product.height || 0,
              largura: product.width || 0,
              profundidade: product.length || 0,
              peso_bruto: product.weight || 0,
              origem: 0,
            },
          })
        : this.parser.parse({
            produto: {
              codigo: product.sku,
              descricao: product.title,
              class_fiscal: product.ncm,
              un: 'Un',
              vlr_unit: product.sellingPrice,
              estoque: currentPosition,
              imagens: { url: images } || null,
              peso_bruto: product.weight || 0,
            },
          });
    return this.sendProductToBling(xml);
  }

  private pushProductWithVariationToBling(product: Product, images: Object[]) {
    const currentPosition =
      product.productVariations[0].currentPosition < 0
        ? 0
        : product.productVariations[0].currentPosition;
    const variations = product.productVariations.map(pv => {
      let description = product.title;
      if (pv.description !== 'Tamanho Único') {
        description = `${description} ${pv.description}`;
      }
      return {
        nome: pv.description,
        codigo: pv.sku,
        vlr_unit: pv.sellingPrice,
        estoque: pv.currentPosition < 0 ? 0 : pv.currentPosition,
        clonarDadosPai: 'S',
      };
    });

    const xml =
      product.category !== 'ACESSORIOS'
        ? this.parser.parse({
            produto: {
              codigo: product.sku,
              descricao: product.title,
              class_fiscal: product.ncm,
              un: 'Un',
              vlr_unit: product.sellingPrice,
              estoque: currentPosition,
              imagens: { url: images } || null,
              variacoes: { variacao: variations },
              altura: product.height || 0,
              largura: product.width || 0,
              profundidade: product.length || 0,
              peso_bruto: product.weight || 0,
              origem: 0,
            },
          })
        : this.parser.parse({
            produto: {
              codigo: product.sku,
              descricao: product.title,
              class_fiscal: product.ncm,
              un: 'Un',
              vlr_unit: product.sellingPrice,
              estoque: currentPosition,
              imagens: { url: images } || null,
              variacoes: { variacao: variations },
              peso_bruto: product.weight || 0,
            },
          });

    return this.sendProductToBling(xml);
  }

  private async pushCompositionProductToBling(
    product: Product,
    images: Object[],
  ) {
    const getCompositionProductsJobs = product.productComposition.map(
      async pc => {
        const compositionProduct = await this.productsCompositionRepository.findOne(
          {
            where: { id: pc.id },
            relations: ['productVariation'],
          },
        );

        return {
          nome: compositionProduct.productVariation.description,
          codigo: compositionProduct.productVariation.sku,
          quantidade: 1,
        };
      },
    );
    const compositions = await Promise.all(getCompositionProductsJobs);

    const xml =
      product.category !== 'ACESSORIOS'
        ? this.parser.parse({
            produto: {
              codigo: product.sku,
              descricao: product.title,
              class_fiscal: product.ncm,
              un: 'Un',
              vlr_unit: product.sellingPrice,
              imagens: { url: images } || null,
              origem: 0,
              estrutura: {
                tipoEstoque: 'V',
                componente: compositions,
              },
              altura: product.height || 0,
              largura: product.width || 0,
              profundidade: product.length || 0,
              peso_bruto: product.weight || 0,
            },
          })
        : this.parser.parse({
            produto: {
              codigo: product.sku,
              descricao: product.title,
              class_fiscal: product.ncm,
              un: 'Un',
              vlr_unit: product.sellingPrice,
              imagens: { url: images } || null,
              origem: 0,
              estrutura: {
                tipoEstoque: 'V',
                componente: compositions,
              },
              peso_bruto: product.weight || 0,
            },
          });

    return this.sendProductToBling(xml);
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

  async insertProductsOnBling() {
    const products = await this.getAllProducts();

    const insertProductsJobs = products
      .filter(p => !p.isComposition)
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

    const insertProductsCompositionJobs = products
      .filter(p => p.isComposition)
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
    await Promise.all(insertProductsCompositionJobs);
  }

  async getAllProducts() {
    const allProducts = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productVariations', 'pv')
      .leftJoinAndSelect('product.productComposition', 'pc')
      .leftJoinAndSelect('product.productImages', 'pi')
      .leftJoinAndSelect('pi.image', 'i')
      .where('product.isActive = true ')
      .getMany();

    const openedSalesOrders = await this.saleOrderRepository.find({
      where: {
        paymentDetails: {
          paymentStatus: PaymentStatus.IN_PROCESS,
          paymentType: PaymentType.BANK_SLIP,
        },
      },
      relations: ['items', 'items.productVariation'],
    });

    const inventoryProduct = openedSalesOrders.flatMap(so => {
      const items = so.items.map(item => {
        return {
          sku: item.productVariation.sku,
          amount: item.amount,
        };
      });
      return items;
    });

    const products = allProducts.map(async p => {
      const getProductVariationInventoryCurrentPositionJobs = p.productVariations.map(
        async pv => {
          const inventory = await this.inventoryService.findBySku(pv.sku);

          const amountProductSlipBankOrder = inventoryProduct
            .filter(p => p.sku === pv.sku)
            .reduce((total, iv) => (total += iv.amount), 0);

          pv.currentPosition =
            inventory.currentPosition + amountProductSlipBankOrder || 0;
          return pv;
        },
      );
      p.productVariations = await Promise.all(
        getProductVariationInventoryCurrentPositionJobs,
      );
      return p;
    });

    return Promise.all(products);
  }

  async insertOrdersOnBling() {
    const orders = await this.saleOrderRepository.find({
      where: {
        paymentDetails: {
          paymentStatus: PaymentStatus.IN_PROCESS,
        },
      },
      relations: ['items', 'customer', 'items.productVariation'],
    });

    const ordesXML = orders.map(async (saleOrder, idx) => {
      return new Promise<void>(res => {
        setTimeout(async () => {
          try {
            await this.createSaleOrderOnBling(saleOrder);
          } catch (e) {
            console.error(e);
          }
          res();
        }, 200 * idx);
      });
    });

    await Promise.all(ordesXML);
  }

  private async createSaleOrderOnBling(saleOrder: SaleOrder) {
    const items = saleOrder.items.map(item => {
      return {
        codigo: item.productVariation.sku,
        descricao: item.productVariation.description,
        un: 'Un',
        qtde: item.amount,
        vlr_unit: item.price,
      };
    });

    const xml = this.parser.parse({
      pedido: {
        numero: saleOrder.id,
        cliente: {
          nome: saleOrder.customer.name,
          cpf_cnpj: saleOrder.customer.cpf,
          email: saleOrder.customer.email || '',
          fone: saleOrder.customer.phoneNumber || null,
          endereco: saleOrder.shipmentDetails.shippingStreetAddress,
          numero: saleOrder.shipmentDetails.shippingStreetNumber,
          complemento: saleOrder.shipmentDetails.shippingStreetNumber2 || null,
          cidade: saleOrder.shipmentDetails.shippingCity,
          uf: saleOrder.shipmentDetails.shippingState,
          cep: saleOrder.shipmentDetails.shippingZipAddress,
          bairro: saleOrder.shipmentDetails.shippingNeighborhood,
        },
        transporte: {
          dados_etiqueta: {
            nome: saleOrder.customer.name,
            endereco: saleOrder.shipmentDetails.shippingStreetAddress,
            numero: saleOrder.shipmentDetails.shippingStreetNumber,
            complemento:
              saleOrder.shipmentDetails.shippingStreetNumber2 || null,
            municipio: saleOrder.shipmentDetails.shippingCity,
            uf: saleOrder.shipmentDetails.shippingState,
            cep: saleOrder.shipmentDetails.shippingZipAddress,
            bairro: saleOrder.shipmentDetails.shippingNeighborhood,
          },
        },
        itens: { item: items },
        vlr_frete: saleOrder.shipmentDetails.shippingPrice,
        vlr_descont: saleOrder.paymentDetails.discount,
      },
    });

    const data = {
      xml: xml,
      apikey: process.env.BLING_APIKEY,
    };

    return this.httpService
      .post('https://bling.com.br/Api/v2/pedido/json/', qs.stringify(data))
      .toPromise();
  }

  async insertProducsAndOrdersOnBling() {
    console.log('start');
    await this.insertProductsOnBling();
    await this.insertOrdersOnBling();
    console.log('finish');
    return 'Migration is compĺete';
  }
}
