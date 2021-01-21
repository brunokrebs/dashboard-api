import { forwardRef, HttpService, Inject, Injectable } from '@nestjs/common';
import htmlToText from 'html-to-text';
import meli from 'mercadolibre';
import { KeyValuePairService } from '../../key-value-pair/key-value-pair.service';
import { Product } from '../../products/entities/product.entity';
import { ProductsService } from '../../products/products.service';
import { IPaginationOpts } from '../../pagination/pagination';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Not, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { MLAd } from './ml-ad.entity';
import { Image } from '../../media-library/image.entity';
import request from 'request-promise';
import { SalesOrderService } from '../../sales-order/sales-order.service';
import { ProductVariation } from '../../products/entities/product-variation.entity';
import { MLError } from './mercado-livre-error.entity';
import { InventoryService } from '../../inventory/inventory.service';
import { InventoryMovement } from '../../inventory/inventory-movement.entity';
import { Cron } from '@nestjs/schedule';
import { uniqBy } from 'lodash';
import { CreateMLAdsDTO } from './create-ml-ads.dto';

const ML_REFRESH_TOKEN_KEY = 'ML_REFRESH_TOKEN';
const ML_ACCESS_TOKEN_KEY = 'ML_ACCESS_TOKEN';
const REFRESH_RATE = 3 * 60 * 60 * 1000; // every three hours

//test aplication
//ML_CLIENT_ID =  8549654584565096,
//ML_CLIENT_SECRET = hnmngMTYNe6Uf8ogcdDzZ9VemjkayZ4s,
//const ML_REDIRECT_URL = 'https://2ad5522b7c94.ngrok.io/mercado-livre';

//production keys
//ML_CLIENT_ID = '6962689565848218';
//ML_CLIENT_SECRET = '0j9pICVyBzxaQ8zGI4UdGlj5HkjWXn6Q';
//const ML_REDIRECT_URL = 'https://digituz.com.br/api/v1/mercado-livre';

@Injectable()
export class MercadoLivreService {
  private mercadoLivre;
  private mercadoLivreSeller: any;

  constructor(
    private keyValuePairService: KeyValuePairService,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(MLError)
    private mlErrorRepository: Repository<MLError>,
    @InjectRepository(ProductVariation)
    private productVariationRepository: Repository<ProductVariation>,
    private httpService: HttpService,
    @InjectRepository(MLAd)
    private mlAdRepository: Repository<MLAd>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    private saleOrderService: SalesOrderService,
    @Inject(forwardRef(() => InventoryService))
    private inventoryService: InventoryService,
  ) {}

  async onModuleInit(): Promise<void> {
    const rt = await this.keyValuePairService.get(ML_REFRESH_TOKEN_KEY);
    const at = await this.keyValuePairService.get(ML_ACCESS_TOKEN_KEY);
    this.mercadoLivre = new meli.Meli(
      process.env.ML_CLIENT_ID,
      process.env.ML_CLIENT_SECRET,
      at?.value,
      rt?.value,
    );

    if (rt && at) {
      this.startRefreshingTokens();
    }
  }

  private refreshTokens() {
    this.mercadoLivre.refreshAccessToken((err, res) => {
      if (err) return console.error(err);
      console.log(res);
      console.log('Mercado Livre access token refreshed successfully');

      this.keyValuePairService.set({
        key: ML_ACCESS_TOKEN_KEY,
        value: res.access_token,
      });

      this.mercadoLivre.get('users/me', (err, response) => {
        if (err) console.error(response);
        this.mercadoLivreSeller = response;
      });
    });
  }

  private startRefreshingTokens() {
    this.refreshTokens();
    setInterval(() => {
      this.refreshTokens();
    }, REFRESH_RATE);
  }

  getAuthURL(): string {
    return this.mercadoLivre.getAuthURL(process.env.ML_REDIRECT_URL);
  }

  fetchTokens(code: string) {
    this.mercadoLivre.authorize(
      code,
      process.env.ML_REDIRECT_URL,
      (err, res) => {
        if (err) throw new Error(err);

        const refreshToken = res.refresh_token;
        const accessToken = res.access_token;

        this.keyValuePairService.set({
          key: ML_REFRESH_TOKEN_KEY,
          value: refreshToken,
        });

        this.keyValuePairService.set({
          key: ML_ACCESS_TOKEN_KEY,
          value: accessToken,
        });

        this.startRefreshingTokens();
      },
    );
  }

  async getToken() {
    return this.keyValuePairService.get(ML_ACCESS_TOKEN_KEY);
  }

  @Transactional()
  async syncAds(mlAds: CreateMLAdsDTO) {
    const createAdJobs = mlAds.products.map(async product => {
      const adDTO: MLAd = {
        categoryId: mlAds.categoryId,
        categoryName: mlAds.categoryName,
        product: product,
        adType: mlAds.adType ? mlAds.adType : 'free',
        isActive: true,
        adDisabled: false,
        additionalPrice: mlAds.additionalPrice,
        needAtualization: false,
      };
      await this.createAd(adDTO);
    });

    return Promise.allSettled(createAdJobs);
  }

  private async mapToMLProduct(product: Product) {
    const productImages = product.productImages
      .map(pi => ({
        id: pi.image.mlImageId,
      }))
      .filter(pi => pi.id !== null);

    if (productImages.length === 0) {
      await this.saveError(
        product,
        'O produto não tem imagens compativeis com o Mercado Livre para ser cadastrado.',
      );
      return this.updateProductProperties(product.id, {
        isSynchronized: false,
      });
    }
    const lastMLAd = product.mlAd[0];
    return product.variationsSize > 1
      ? this.mapProductWithVariationsForCreation(
          product,
          productImages,
          lastMLAd.additionalPrice,
        )
      : this.mapProductWithoutVariationsForCreation(
          product,
          productImages,
          lastMLAd.additionalPrice,
        );
  }

  private mapProductWithoutVariationsForCreation(
    product: Product,
    productImages: { id: string }[],
    additionalPrice = 0,
  ) {
    const singleVariation = product.productVariations[0];
    let productInfos: any;
    if (
      process.env.NODE_ENV !== 'development' &&
      process.env.NODE_ENV !== 'test'
    ) {
      productInfos = {
        title: product.title,
        saleTerms: [],
      };
    } else {
      productInfos = {
        title: 'Item de Teste - Por favor, NÃO OFERTAR!',
        saleTerms: [],
      };
    }
    return {
      category_id: product.mlAd[0].categoryId,
      description: {
        plain_text: htmlToText.fromString(product.productDetails),
      },
      condition: 'new',
      buying_mode: 'buy_it_now',
      available_quantity: singleVariation.currentPosition,
      pictures: productImages,
      price: singleVariation.sellingPrice + additionalPrice,
      currency_id: 'BRL',
      tags: ['immediate_payment'],
      sale_terms: productInfos.saleTerms,
      title: productInfos.title,
      listing_type_id: product.mlAd[0].adType,
      shipping: {
        mode: 'me2',
        local_pick_up: false,
        free_shipping: false,
        free_methods: [],
      },
      attributes: [
        {
          id: 'BRAND',
          value_id: '8795668',
          value_name: 'Frida Kahlo',
        },
        {
          id: 'SELLER_SKU',
          value_name: singleVariation.sku,
        },
        {
          id: 'DIAMETER',
          value_name: `${product.width * 10} mm`,
        },
        {
          id: 'HEIGHT',
          value_name: `${product.height * 10} mm`,
        },
        {
          id: 'LENGTH',
          value_name: `${product.length * 10} mm`,
        },
        {
          id: 'GEMSTONE_TYPE',
          value_name: null,
        },
      ],
    };
  }

  private mapProductWithVariationsForCreation(
    product: Product,
    productImages: { id: string }[],
    additionalPrice = 0,
  ) {
    let productInfos: any;
    if (
      process.env.NODE_ENV !== 'development' &&
      process.env.NODE_ENV !== 'test'
    ) {
      productInfos = {
        title: product.title,
        saleTerms: [],
      };
    } else {
      productInfos = {
        title: 'Item de Teste - Por favor, NÃO OFERTAR!',
        saleTerms: [],
      };
    }

    const images = productImages.map(image => image.id);
    const price = product.productVariations.reduce(
      (total, variation) =>
        total < variation.sellingPrice
          ? (total = variation.sellingPrice)
          : total,
      0,
    );
    const variations = product.productVariations.map(variation => {
      return {
        price: price + additionalPrice,
        available_quantity: variation.currentPosition,
        picture_ids: images,
        attribute_combinations: [
          {
            id: 'SIZE',
            name: 'Tamanho',
            value_name: variation.description,
          },
        ],
        atributes: [
          {
            id: 'PACKAGE_HEIGHT',
            value_name: '25 cm',
          },
          {
            id: 'PACKAGE_WIDTH',
            value_name: '17 cm',
          },
          {
            id: 'SELLER_SKU',
            value_name: variation.sku,
          },
        ],
      };
    });

    return {
      category_id: product.mlAd[0].categoryId,
      description: {
        plain_text: htmlToText.fromString(product.productDetails),
      },
      condition: 'new',
      buying_mode: 'buy_it_now',
      pictures: productImages,
      currency_id: 'BRL',
      tags: ['immediate_payment'],
      sale_terms: productInfos.saleTerms,
      title: productInfos.title,
      listing_type_id: product.mlAd[0].adType,
      shipping: {
        mode: 'me2',
        local_pick_up: false,
        free_shipping: false,
        free_methods: [],
      },
      attributes: [
        {
          id: 'BRAND',
          value_id: '8795668',
          value_name: 'Frida Kahlo',
        },
      ],
      variations,
    };
  }

  async paginate(options: IPaginationOpts): Promise<Pagination<Product>> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.mlAd', 'ml', 'ml.isActive = true')
      .where({
        isActive: true,
      });

    options.queryParams
      .filter(queryParam => {
        return (
          queryParam !== null &&
          queryParam.value !== null &&
          queryParam.value !== undefined
        );
      })
      .forEach(queryParam => {
        switch (queryParam.key) {
          case 'query':
            queryBuilder.andWhere(
              new Brackets(qb => {
                qb.where(`lower(product.title) like lower(:query)`, {
                  query: `%${queryParam.value.toString()}%`,
                })
                  .orWhere(`lower(product.sku) like lower(:query)`, {
                    query: `%${queryParam.value.toString()}%`,
                  })
                  .orWhere(`lower(ml.mercado_livre_id) like lower(:query)`, {
                    query: `%${queryParam.value.toString()}%`,
                  })
                  .orWhere(`lower(ml.category_id) like lower(:query)`, {
                    query: `%${queryParam.value.toString()}%`,
                  });
              }),
            );
            break;
          case 'status':
            if (queryParam.value.toString() === 'notSync') {
              queryBuilder.andWhere(
                'product.id NOT IN (SELECT product_id FROM ml_ad)',
              );
            } else {
              queryBuilder.andWhere('ml.is_synchronized = :status', {
                status: queryParam.value,
              });
            }
            break;
        }
      });

    let sortDirection;
    let sortNulls;
    switch (options.sortDirectionAscending) {
      case undefined:
      case null:
      case true:
        sortDirection = 'ASC';
        sortNulls = 'NULLS FIRST';
        break;
      default:
        sortDirection = 'DESC';
        sortNulls = 'NULLS LAST';
    }
    const orderColumn = 'product.title';
    queryBuilder.orderBy(orderColumn, sortDirection, sortNulls);
    const results = await paginate<Product>(queryBuilder, options);
    return new Pagination(
      await Promise.all(
        results.items.map(async (item: Product) => {
          return item;
        }),
      ),
      results.meta,
      results.links,
    );
  }

  async getMLCategory(query: string) {
    const response = await this.httpService
      .get(
        `https://api.mercadolibre.com/sites/MLB/domain_discovery/search?limit=4&q=${encodeURI(
          query,
        )}`,
      )
      .toPromise();
    return response.data;
  }

  async getProduct(sku: string) {
    const queryBuilder = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.mlAd', 'mlAd')
      .where({ sku })
      .getOne();
    return queryBuilder;
  }

  private async createAd(mlAdDTO: MLAd) {
    // sync product images with ML
    await this.saveImagesOnML([mlAdDTO.product.id]);

    // load product details
    const product = await this.productsService.findProductToML(
      mlAdDTO.product.id,
    );

    // check if it can be synced
    if (
      product.productVariations.length < 1 ||
      !product.isActive ||
      !mlAdDTO.categoryId ||
      product.productImages?.length < 1
    )
      return;

    // map and save new ML ad
    const mlAd: MLAd = {
      categoryId: mlAdDTO.categoryId,
      categoryName: mlAdDTO.categoryName,
      product: mlAdDTO.product,
      adType: mlAdDTO.adType,
      isActive: true,
      additionalPrice: mlAdDTO.additionalPrice,
      adDisabled: false,
      needAtualization: false,
    };

    product.mlAd.push(mlAd);

    // close existing ads on ML
    await this.closeAdML(product.id);

    let response: any;
    // create new ad
    const syncAdJob = new Promise<boolean>(async res => {
      const adMappedToML = await this.mapToMLProduct(product);
      if (!adMappedToML) return res(false);
      return this.mercadoLivre.post(
        'items',
        adMappedToML,
        async (err, resp) => {
          if (err) return res(false);
          if (!resp.id) {
            await this.updateProductProperties(
              // FIXME
              product.id,
              {
                isSynchronized: false,
              },
              resp.variations,
            );
            await this.saveError(product, 'Houve algum erro');
            return res(false);
          }
          product.mlAd[product.mlAd.length - 1].mercadoLivreId = resp.id;
          response = resp;
          res(true);
        },
      );
    });

    const adCreated = await syncAdJob;

    if (!adCreated) return;

    // add new ad to the database
    const persistedAd = await this.mlAdRepository.save(mlAd); // FIXME

    // deactivate past ads (if any)
    await this.mlAdRepository.update(
      {
        id: Not(persistedAd.id),
        product: mlAdDTO.product,
      },
      {
        isActive: false,
      },
    );

    await this.updateProductProperties(
      // FIXME
      product.id,
      {
        mercadoLivreId: response.id,
        isSynchronized: true,
      },
      response.variations,
    );
  }

  @Transactional()
  async updateProductProperties(
    productId: number,
    properties: Partial<MLAd>,
    variations?: any[],
  ) {
    if (variations?.length > 0) {
      const updateVariationsOnDBJobs = variations.map(variation => {
        return this.productVariationRepository.update(
          {
            product: { id: productId },
            description: variation.attribute_combinations[0].value_name,
          },
          { mlVariationId: variation.id },
        );
      });
      await Promise.all(updateVariationsOnDBJobs);
    }
    return this.mlAdRepository.update(
      { product: { id: productId }, isActive: true, adDisabled: false },
      properties,
    );
  }

  private async saveImagesOnML(productIds: number[]) {
    const inIds = productIds.join(',');
    const images = await this.imageRepository
      .createQueryBuilder('im')
      .where({ mlImageStatus: null })
      .andWhere(
        'im.id in (select image_id from product_image where product_id in (:productIds));',
        { productIds: inIds },
      )
      .getMany();

    const accessToken = await this.keyValuePairService.get(ML_ACCESS_TOKEN_KEY);

    const savedImages = images.map((image, idx) => {
      return new Promise<void>(res => {
        setTimeout(async () => {
          try {
            const imageBuffer = await request({
              url: image.originalFileURL,
              encoding: null,
            });

            // create upload request
            const uploadJob = request.post(
              'https://api.mercadolibre.com/pictures/items/upload',
              {
                json: true,
                headers: {
                  authorization: `Bearer ${accessToken.value}`,
                },
              },
            );
            const form = uploadJob.form();
            form.append('file', imageBuffer, {
              filename: image.originalFilename,
              contentType: image.mimetype,
            });
            const uploadResult = await uploadJob;

            // FIXME
            await this.imageRepository.update(
              {
                id: image.id,
              },
              {
                mlImageId: uploadResult.id,
                mlImageStatus: true,
              },
            );
            return res();
          } catch (err) {
            await this.imageRepository.update(
              {
                id: image.id,
              },
              {
                mlImageStatus: false,
              },
            );
            return res();
          }
        }, 550 * idx);
      });
    });

    await Promise.all(savedImages);
  }

  @Cron('0 * * * * *')
  @Transactional()
  async createOrderOnDigituz() {
    const getOrders = new Promise((res, rej) => {
      return this.mercadoLivre.get(
        `orders/search`,
        {
          seller: this.mercadoLivreSeller.id,
          sort: 'date_desc',
        },
        (err, response) => {
          if (err) return rej(err);
          return res(response.results);
        },
      );
    });

    const orders: any = await getOrders;

    const packsIds = uniqBy(
      orders.filter(order => order.pack_id).map(order => order.pack_id),
      'pack_id',
    );

    const compositeOrders = packsIds.map(pack => {
      const relatedOrders = orders.filter(order => order.pack_id === pack);
      const order: any = relatedOrders[0];
      const items: any = [];
      for (let i = 0; i < relatedOrders.length; i++) {
        items.push(relatedOrders[i].order_items);
      }
      order.order_items = items.flat();
      return order;
    });

    const simpleOrder = orders.filter(order => !order.pack_id);
    const allOrders: any = [...simpleOrder, ...compositeOrders];

    const mapShippingJob = allOrders.map(order => {
      return new Promise((res, rej) => {
        return this.mercadoLivre.get(
          `shipments/${order.shipping.id}`,
          async (err, response) => {
            if (err) return rej(err);
            order.shipping = response;
            res('getOrder');
          },
        );
      });
    });

    await Promise.all(mapShippingJob);
    for (const order of allOrders) {
      await this.saleOrderService.saveSaleOrderFromML(order);
    }
  }

  async getErros(options: IPaginationOpts) {
    const queryBuilder = this.mlErrorRepository
      .createQueryBuilder('error')
      .leftJoinAndSelect('error.product', 'product');
    queryBuilder.orderBy('error.id', 'DESC', 'NULLS LAST');

    return paginate<MLError>(queryBuilder, options);
  }

  @Transactional()
  async saveError(product: Product, msg: string) {
    const mlError: MLError = {
      product,
      error: msg,
    };
    await this.mlErrorRepository.save(mlError);
    return;
  }

  @Transactional()
  async deleteErros() {
    return this.mlErrorRepository
      .createQueryBuilder('mlError')
      .delete()
      .execute();
  }

  async getShippingPDF(shippingLabel: string) {
    const shippingPDFJob = new Promise((res, rej) => {
      return this.mercadoLivre.get(
        `/shipment_labels`,
        { shipment_ids: shippingLabel, response_type: 'pdf' },
        async (err, response) => {
          if (err) return rej(err);
          res(response);
        },
      );
    });
    return Promise.resolve(shippingPDFJob);
  }

  @Transactional()
  async closeAdML(id: number, isInativeProduct: boolean = null) {
    let ads: MLAd[];

    if (isInativeProduct) {
      ads = await this.mlAdRepository.find({
        where: { product: { id } },
      });
    } else {
      ads = await this.mlAdRepository.find({
        where: { product: { id }, isActive: false, adDisabled: false },
      });
    }

    if (ads.length == 0) return null;

    const closedAdJob = ads.map(ad => {
      return new Promise((res, rej) => {
        this.mercadoLivre.put(
          `items/${ad.mercadoLivreId}`,
          { status: 'closed' },
          async err => {
            if (err) return rej(err);
            await this.mlAdRepository.save({
              id: ad.id,
              mercadoLivreId: ad.mercadoLivreId,
              isActive: false,
              adDisabled: true,
            });
            res('updated product status with sucess');
          },
        );
      });
    });
    return Promise.all(closedAdJob);
  }

  @Transactional()
  async updateMLInventory(movement: InventoryMovement) {
    return new Promise((res, rej) => {
      const { inventory } = movement;
      const { productVariation } = inventory;
      const { product } = productVariation;

      if (!product.mlAd || !product.mlAd[0]) return;

      const lastMLAd = product.mlAd[0];

      const mlInventoryEndpoint =
        product.variationsSize > 1
          ? `items/${lastMLAd.mercadoLivreId}`
          : `items/${lastMLAd.mercadoLivreId}/variations/${productVariation.mlVariationId}`;

      this.mercadoLivre.put(
        mlInventoryEndpoint,
        { available_quantity: inventory.currentPosition },
        err => {
          if (err) return rej(err);
          res(`Estoque do produto ${product.sku} foi atualizado com sucesso.`);
        },
      );
    });
  }
}
