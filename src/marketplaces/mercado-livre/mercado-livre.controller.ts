import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  Put,
  Body,
} from '@nestjs/common';
import { MercadoLivreService } from './mercado-livre.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Pagination } from 'nestjs-typeorm-paginate';
import { parseBoolean } from '../../util/parsers';
import { Product } from '../../products/entities/product.entity';
import { MLProductDTO } from './mercado-livre.dto';
import { MLProduct } from './mercado-livre.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('mercado-livre')
export class MercadoLivreController {
  mercadoLivre: any;
  accessToken: string;
  refreshToken: string;

  constructor(
    private mercadoLivreService: MercadoLivreService,
    @InjectRepository(MLProduct)
    private mlProductRepository: Repository<MLProduct>,
  ) {}

  @Get('notification')
  getNotification() {
    return console.log('chegou notificação');
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  fetchTokens(@Query('code') code: string) {
    this.mercadoLivreService.fetchTokens(code);
  }

  @Get('/token')
  @UseGuards(JwtAuthGuard)
  getToken() {
    return this.mercadoLivreService.getToken();
  }

  @Get('/authorize')
  @UseGuards(JwtAuthGuard)
  authenticate(): string {
    return this.mercadoLivreService.getAuthURL();
  }

  @Get('/paginate')
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortedBy') sortedBy: string,
    @Query('sortDirectionAscending') sortDirectionAscending: string,
    @Query('query') query: string,
  ): Promise<Pagination<Product>> {
    return this.mercadoLivreService.paginate({
      page,
      limit,
      sortedBy,
      sortDirectionAscending: parseBoolean(sortDirectionAscending),
      queryParams: [
        {
          key: 'query',
          value: query,
        },
      ],
    });
  }

  @Get('/product')
  @UseGuards(JwtAuthGuard)
  async getProduct(@Query('sku') sku: string) {
    return this.mercadoLivreService.getProduct(sku);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  async saveAll(@Body() mlProducts: MLProductDTO): Promise<void> {
    return this.mercadoLivreService.createProducts(mlProducts);
  }

  @Post('/save')
  @UseGuards(JwtAuthGuard)
  async save(@Body() mlProduct: MLProductDTO): Promise<void> {
    const mercadoLivreId = await this.mlProductRepository.findOne({
      select: ['mercadoLivreId'],
      where: { id: mlProduct.id },
    });
    if (mercadoLivreId) {
      return this.mercadoLivreService.updateProducts(mlProduct.product.id);
    } else {
      return this.mercadoLivreService.save(mlProduct);
    }
  }

  @Get('category')
  @UseGuards(JwtAuthGuard)
  async getMLCategory(@Query('query') query: string) {
    return this.mercadoLivreService.getMLCategory(query);
  }
}
