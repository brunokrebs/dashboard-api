import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  Body,
  Delete,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MercadoLivreService } from './mercado-livre.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Pagination } from 'nestjs-typeorm-paginate';
import { parseBoolean } from '../../util/parsers';
import { Product } from '../../products/entities/product.entity';
import { response } from 'express';
import { NotificationRecived } from './notificationReceived.interface';
import { MLError } from './mercado-livre-error.entity';

@Controller('mercado-livre')
export class MercadoLivreController {
  mercadoLivre: any;
  accessToken: string;
  refreshToken: string;

  constructor(private mercadoLivreService: MercadoLivreService) {}

  @Post('/notification')
  getNotification(@Body() notification: NotificationRecived) {
    this.mercadoLivreService.notificationReceived(notification);
    return response.status(200);
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
    @Query('status') status: string,
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
        {
          key: 'status',
          value: parseBoolean(status),
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
  async saveAll(@Body() adProducts): Promise<any> {
    return this.mercadoLivreService.createProducts(adProducts);
  }

  @Post('/save')
  @UseGuards(JwtAuthGuard)
  async save(@Body() adProduct): Promise<void> {
    return this.mercadoLivreService.save(adProduct);
  }

  @Get('category')
  @UseGuards(JwtAuthGuard)
  async getMLCategory(@Query('query') query: string) {
    return this.mercadoLivreService.getMLCategory(query);
  }

  @Delete('delete-erros')
  @UseGuards(JwtAuthGuard)
  async deleteErros() {
    return this.mercadoLivreService.deleteErros();
  }

  @Get('errors')
  @UseGuards(JwtAuthGuard)
  async getErros(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<Pagination<MLError>> {
    return this.mercadoLivreService.getErros({
      page,
      limit,
    });
  }

  @Get('shipping-label')
  @UseGuards(JwtAuthGuard)
  async getShippingLabel(
    @Query('id') shipppingLabel: string,
    @Res() res: Response,
  ) {
    const pdf = await this.mercadoLivreService.getShippingPDF(shipppingLabel);
    res.status(HttpStatus.OK).send(pdf);
  }
}
