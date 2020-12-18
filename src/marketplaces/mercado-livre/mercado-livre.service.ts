import { HttpService, Injectable } from '@nestjs/common';
import htmlToText from 'html-to-text';
import meli from 'mercadolibre';
import { KeyValuePairService } from '../../key-value-pair/key-value-pair.service';
import { Product } from '../../products/entities/product.entity';
import { ProductsService } from '../../products/products.service';
import { ProductCategory } from '../../products/entities/product-category.enum';
import { IPaginationOpts } from '../../pagination/pagination';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { MLProductDTO } from './mercado-livre.dto';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { MLProduct } from './mercado-livre.entity';
import { Image } from '../../media-library/image.entity';
import request from 'request-promise';

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
  private mercadoLivreCategoryMapping: any = {};

  constructor(
    private keyValuePairService: KeyValuePairService,
    private productsService: ProductsService,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private httpService: HttpService,
    @InjectRepository(MLProduct)
    private mlProductRepository: Repository<MLProduct>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
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

  async updateProducts() {
    const products = await this.productsService.findAll();
    const berloques = products.filter(product => {
      return (
        product.mercadoLivreId && product.category === ProductCategory.BERLOQUES
      );
    });
    const jobs = berloques.map(async berloque =>
      this.updateProductDetails(berloque, true),
    );
    await Promise.all(jobs);
  }

  async createProducts() {
    await this.saveImagesOnML();
    const products = await this.productsService.findAll();

    const activeNoVariationProducts = products.filter(product => {
      return (
        product.productVariations.length >= 1 &&
        product.isActive &&
        !product.MLProduct.mercadoLivreId &&
        product.MLProduct.categoryId &&
        product.productImages?.length > 0
      );
    });

    const createJobs = activeNoVariationProducts.map((product, idx) => {
      return new Promise((res, rej) => {
        setTimeout(async () => {
          const mlProduct = await this.mapToMLProduct(product);
          this.mercadoLivre.post('items', mlProduct, async (err, response) => {
            if (err) return rej(err);
            if (!response.id) {
              console.log(product.sku, response.cause);
              return rej(`Unable to create ${product.sku} on Mercado Livre.`);
            }
            product.mercadoLivreId = response.id;
            await this.updateProductProperties(product.id, {
              mercadoLivreId: response.id,
            });
            console.log(`${product.sku} created successfully`);
            res();
          });
        }, idx * 250);
      });
    });
    await Promise.all(createJobs).catch(err => console.log(err));
  }

  private async mapToMLProduct(product: Product) {
    const productImages = product.productImages
      .map(pi => ({
        id: pi.image.mlImageId,
      }))
      .filter(pi => pi.id !== null);

    if (productImages.length === 0) {
      console.log(`${product.sku} não tem imagens para ser cadastrado no ml`);
      return; //mostrar que esse producto não tem imagens para ser cadastrado
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

    return {
      category_id: product.MLProduct.categoryId,
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
      // subtitle: null, // TODO ml-integration check is valuable?
      sale_terms: [], // TODO ml-integration check is valuable?
      title: 'Item de Teste - Por favor, NÃO OFERTAR!', // TODO ml-integration fix
      listing_type_id: 'gold_pro', // TODO ml-integration fix (gold_special, gold_pro, silver)
      shipping: null, // TODO ml-integration fix
      // payment_method: null, // TODO ml-integration fix (needed?)
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
        price: price, //ver a questão de preço ter que ser igual nas variações
        available_quantity: variation.currentPosition,
        picture_ids: images, //por algum motivo ainda temos o problema com a quantidade de imagens sendo 0
        attribute_combinations: [
          {
            id: 'COLOR',
            name: 'Cor',
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
      category_id: product.MLProduct.categoryId,
      description: product.description,
      condition: 'new',
      buying_mode: 'buy_it_now',
      pictures: productImages,
      currency_id: 'BRL',
      tags: ['immediate_payment'],
      sale_terms: [], // TODO ml-integration fix
      title: 'Item de Teste - Por favor, NÃO OFERTAR!', // TODO ml-integration fix
      listing_type_id: 'gold_special', // TODO ml-integration fix (gold_special, gold_pro)
      shipping: null, // TODO ml-integration fix
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

  private async updateProductExposure(product: Product) {
    return new Promise((res, rej) => {
      const exposure: any = {
        id: 'gold_pro',
      };
      this.mercadoLivre.post(
        `items/${product.mercadoLivreId}/listing_type`,
        exposure,
        async (err, response) => {
          if (err) return rej(err);
          if (!response.id) {
            return rej(
              `Unable to update exposure of ${product.sku} (${product.mercadoLivreId}) on Mercado Livre.`,
            );
          }
          res();
        },
      );
    });
  }

  private async updateProductDescription(product: Product) {
    if (!product.productDetails) return Promise.resolve();
    return new Promise((res, rej) => {
      const updatedProperties: any = {
        plain_text: htmlToText.fromString(product.productDetails),
      };
      this.mercadoLivre.put(
        `items/${product.mercadoLivreId}/description`,
        updatedProperties,
        async (err, response) => {
          if (err) return rej(err);
          if (!response.plain_text) {
            return rej(
              `Unable to update ${product.sku} (${product.mercadoLivreId}) on Mercado Livre.`,
            );
          }
          res();
        },
      );
    });
  }

  private async updateProductDetails(
    product: Product,
    updateTitle: boolean,
    updateExposure?: boolean,
  ) {
    return new Promise((res, rej) => {
      const updatedProperties: any = {
        attributes: [
          {
            id: 'MATERIAL',
            value_id: '2481975',
            value_name: 'Prata',
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
      if (updateTitle) {
        updatedProperties.title = product.title;
      }
      this.mercadoLivre.put(
        `items/${product.mercadoLivreId}`,
        updatedProperties,
        async (err, response) => {
          if (err) return rej(err);
          await this.updateProductDescription(product);
          if (updateExposure) {
            await this.updateProductExposure(product);
          }
          if (!response.id) {
            return rej(
              `Unable to update ${product.sku} (${product.mercadoLivreId}) on Mercado Livre.`,
            );
          }
          console.log(
            `${product.sku} (${product.mercadoLivreId}) updated successfully`,
          );
          res();
        },
      );
    });
  }

  async paginate(options: IPaginationOpts): Promise<Pagination<Product>> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.MLProduct', 'ml')
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
      .leftJoinAndSelect('product.MLProduct', 'ml')
      .where({ sku })
      .getOne();

    return queryBuilder;
  }

  async save(mlProduct: MLProductDTO) {
    console.log(mlProduct);
  }

  @Transactional()
  async updateProductProperties(
    productId: number,
    properties: Partial<MLProduct>,
  ) {
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
            res();
          } catch (err) {
            console.error(err);
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
}
