import { Controller, Get } from '@nestjs/common';
import { BlingService } from './bling.service';

@Controller('bling')
export class BlingController {
  constructor(private blingService: BlingService) {}
  @Get('/migration')
  async graphicalData() {
    return this.blingService.insertProducsAndOrdersOnBling();
  }
}
