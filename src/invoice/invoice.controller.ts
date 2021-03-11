import { Controller, Get } from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Controller('invoice')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Get()
  public checkStatus(): void {
    this.invoiceService.checkStatus();
  }
}
