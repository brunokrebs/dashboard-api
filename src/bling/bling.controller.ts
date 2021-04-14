import { Controller, Post } from '@nestjs/common';
import { BlingService } from './bling.service';

@Controller('bling')
export class BlingController {
  constructor(private blingService: BlingService) {}

  @Post()
  async createProductsOnBling() {
    this.blingService.insertAllOrdersOnBling();
  }
}
