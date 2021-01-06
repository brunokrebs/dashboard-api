import { HttpService, Injectable } from '@nestjs/common';
import htmlToText from 'html-to-text';
import meli from 'mercadolibre';
import { KeyValuePairService } from '../../key-value-pair/key-value-pair.service';
import { Product } from '../../products/entities/product.entity';
import { ProductsService } from '../../products/products.service';
import { IPaginationOpts } from '../../pagination/pagination';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { MLProductDTO } from './mercado-livre.dto';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { adProduct } from './mercado-livre.entity';
import { Image } from '../../media-library/image.entity';
import request from 'request-promise';
import { NotificationRecived } from './notificationReceived.interface';
import { SalesOrderService } from '../../sales-order/sales-order.service';
import { ProductVariation } from '../../products/entities/product-variation.entity';
import { MLError } from './mercado-livre-error.entity';

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

  constructor(
    private keyValuePairService: KeyValuePairService,
    private productsService: ProductsService,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(MLError)
    private mlErrorRepository: Repository<MLError>,
    @InjectRepository(ProductVariation)
    private productVariationRepository: Repository<ProductVariation>,
    private httpService: HttpService,
    @InjectRepository(adProduct)
    private mlProductRepository: Repository<adProduct>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    private saleOrderService: SalesOrderService,
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
      console.log('mercado livre access token refreshed successfully');
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

  async createProducts(mlProducts: any) {
    const ids = mlProducts.products.map(product => product.id);
    await this.mlProductRepository.update(
      {
        product: In(ids),
      },
      {
        isActive: false,
      },
    );
    const insertMLProductsJob = mlProducts.products.map((product, idx) => {
      const adProduct: adProduct = {
        id: product.mlId,
        categoryId: mlProducts.category.id,
        categoryName: mlProducts.category.name,
        product: product,
        adType: mlProducts.adType ? mlProducts.adType : 'free',
        isActive: true,
        needAtualization: false,
      };
      return this.mlProductRepository.save(adProduct);
    });
    await Promise.all(insertMLProductsJob);
    await this.saveImagesOnML();
    const products = await this.productsService.findProductsToML(ids);

    const activeNoVariationProducts = products.filter(product => {
      return (
        product.productVariations.length >= 1 &&
        product.isActive &&
        !product.adProduct[0].mercadoLivreId &&
        product.adProduct[0].categoryId &&
        product.productImages?.length > 0
      );
    });

    const createJobs = activeNoVariationProducts.map((product, idx) => {
      return new Promise((res, rej) => {
        setTimeout(async () => {
          const adProduct = await this.mapToMLProduct(product);
          this.mercadoLivre.post('items', adProduct, async (err, response) => {
            this.createProductOnML(product);
            res('');
          });
        }, idx * 250);
      });
    });
    await Promise.all(createJobs);
  }

  private mapToMLProduct(product: Product) {
    const productImages = product.productImages
      .map(pi => ({
        id: pi.image.mlImageId,
      }))
      .filter(pi => pi.id !== null);

    if (productImages.length === 0) {
      this.saveError(
        product,
        'O produto não tem imagens compativeis com o mercado para ser cadastrado',
      );
    }
    return product.variationsSize > 1
      ? this.mapProductWithVariationsForCreation(product, productImages)
      : this.mapProductWithoutVariationsForCreation(product, productImages);
  }

  private mapProductWithoutVariationsForCreation(
    product: Product,
    productImages: { id: string }[],
  ) {
    const singleVariation = product.productVariations[0];
    let productInfos: any;
    if (
      process.env.NODE_ENV !== 'development' &&
      process.env.NODE_ENV !== 'test'
    ) {
      productInfos = {
        title: product.title,
        listingTypeId: product.adProduct[0].adType,
        saleTerms: [],
      };
    } else {
      productInfos = {
        title: 'Item de Teste - Por favor, NÃO OFERTAR!',
        listingTypeId: 'gold_pro',
        saleTerms: [],
      };
    }
    return {
      category_id: product.adProduct[0].categoryId,
      description: {
        plain_text: htmlToText.fromString(product.productDetails),
      },
      condition: 'new',
      buying_mode: 'buy_it_now',
      available_quantity: singleVariation.currentPosition,
      pictures: productImages,
      price: singleVariation.sellingPrice,
      currency_id: 'BRL',
      tags: ['immediate_payment'],
      sale_terms: productInfos.saleTerms,
      title: productInfos.title,
      listing_type_id: productInfos.listingTypeId,
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
  ) {
    let productInfos: any;
    if (
      process.env.NODE_ENV !== 'development' &&
      process.env.NODE_ENV !== 'test'
    ) {
      productInfos = {
        title: product.title,
        listingTypeId: product.adProduct[0].adType,
        saleTerms: [],
      };
    } else {
      productInfos = {
        title: 'Item de Teste - Por favor, NÃO OFERTAR!',
        listingTypeId: 'gold_pro',
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
        price: price,
        available_quantity: variation.currentPosition,
        picture_ids: images,
        attribute_combinations: [
          {
            id: 'COLOR',
            name: 'Tamanho',
            value_name: variation.description,
          },
        ],
        atributes: [
          {
            // TODO
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
      category_id: product.adProduct[0].categoryId,
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
      listing_type_id: productInfos.listingTypeId,
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
      .leftJoinAndSelect('product.adProduct', 'ml', 'ml.isActive = true')
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
            queryBuilder.andWhere('ml.is_synchronized = :status', {
              status: queryParam.value,
            });
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
    const categories = this.httpService
      .get(
        `https://api.mercadolibre.com/sites/MLB/domain_discovery/search?limit=4&q=${query}`,
      )
      .toPromise();

    return (await categories).data;
  }

  async getProduct(sku: string) {
    const queryBuilder = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.adProduct', 'adProdcut')
      .where({ sku })
      .getOne();
    return queryBuilder;
  }

  @Transactional()
  async save(mlProductDTO: MLProductDTO) {
    await this.saveImagesOnML();

    await this.mlProductRepository.update(
      {
        product: mlProductDTO.product,
      },
      {
        isActive: false,
      },
    );

    const adProduct: adProduct = {
      id: mlProductDTO?.id,
      categoryName: mlProductDTO.categoryName,
      categoryId: mlProductDTO.categoryId,
      product: mlProductDTO.product,
      adType: mlProductDTO.adType,
      isActive: true,
      isSynchronized: mlProductDTO.isSynchronized,
      needAtualization: false,
    };
    await this.mlProductRepository.save(adProduct);
    //search the product for insert in mercado livre
    const product = await this.productsService.findProductsToML([
      mlProductDTO.product.id,
    ]);

    await this.createProductOnML(product[0]);
  }

  @Transactional()
  async updateProductProperties(
    productId: number,
    properties: Partial<adProduct>,
    variations?: any[],
  ) {
    if (variations?.length > 0) {
      variations.forEach(async variation => {
        return this.productVariationRepository.update(
          {
            description: variation.attribute_combinations[0].value_name,
          },
          { mlVariationId: variation.id },
        );
      });
    }
    return this.mlProductRepository.update(
      { product: { id: productId } },
      properties,
    );
  }

  async saveImagesOnML() {
    const images = await this.imageRepository
      .createQueryBuilder('im')
      .where({ mlImageStatus: null })
      .andWhere('im.id in (SELECT image_id	 from product_image);')
      .getMany();

    const savedImages = images.map((image, idx) => {
      return new Promise(res => {
        setTimeout(async () => {
          try {
            const accessToken = await this.keyValuePairService.get(
              ML_ACCESS_TOKEN_KEY,
            );

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

            await this.imageRepository.update(
              {
                id: image.id,
              },
              {
                mlImageId: uploadResult.id,
                mlImageStatus: true,
              },
            );
            res('Image update sucess');
          } catch (err) {
            await this.imageRepository.update(
              {
                id: image.id,
              },
              {
                mlImageStatus: false,
              },
            );
          }
        }, 550 * idx);
      });
    });

    await Promise.all(savedImages);
    return;
  }

  createProductOnML(product: Product) {
    return new Promise((res, rej) => {
      const adProduct = this.mapToMLProduct(product);
      return this.mercadoLivre.post(
        'items',
        adProduct,
        async (err, response) => {
          if (err) return err;
          if (!response.id) {
            await this.updateProductProperties(
              product.id,
              {
                isSynchronized: false,
              },
              response.variations,
            );
            await this.saveError(product, 'Ouve algum erro');
            return rej(`Unable to create ${product.sku} on Mercado Livre.`);
          }
          product.adProduct[0].mercadoLivreId = response.id;

          await this.updateProductProperties(
            product.id,
            {
              mercadoLivreId: response.id,
              isSynchronized: true,
            },
            response.variations,
          );
          res(`${product.sku} created successfully`);
        },
      );
    });
  }

  notificationReceived(notification: NotificationRecived) {
    switch (notification.topic) {
      case 'created_orders':
        this.createOrderOnDigituz(notification.resource);
        break;
    }
  }

  async createOrderOnDigituz(url: string) {
    const accessToken = await this.keyValuePairService.get(ML_ACCESS_TOKEN_KEY);
    let mlOrder: any;
    const orderJob = new Promise((res, rej) => {
      return this.mercadoLivre.get(
        '/orders/4281367147',
        adProduct,
        async (err, response) => {
          if (err) return err;
          mlOrder = response;
          res('getOrder');
        },
      );
    });

    await Promise.resolve(orderJob);

    let shippingDetails: any;
    const shippingDetailsJob = new Promise((res, rej) => {
      return this.mercadoLivre.get(
        `shipments/${mlOrder.shipping.id}`,
        async (err, response) => {
          if (err) return err;
          shippingDetails = response;
          res('getOrder');
        },
      );
    });
    await Promise.resolve(shippingDetailsJob);
    this.saleOrderService.saveSaleOrderFromML(mlOrder, shippingDetails);
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

  /*
  
    this.saleOrderService.saveSaleOrderFromML(mlOrder);*/
}
