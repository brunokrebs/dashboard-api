import { Controller, Post, Get, Query, UseGuards, Put } from '@nestjs/common';
import { MercadoLivreService } from './mercado-livre.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('mercado-livre')
export class MercadoLivreController {
  mercadoLivre: any;
  accessToken: string;
  refreshToken: string;

  constructor(private mercadoLivreService: MercadoLivreService) {}

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

  @Post('/')
  @UseGuards(JwtAuthGuard)
  async save(): Promise<void> {
    return this.mercadoLivreService.createProducts();
  }

  @Put('/')
  @UseGuards(JwtAuthGuard)
  async update(): Promise<void> {
    return this.mercadoLivreService.updateProducts();
  }
}
