import { Controller, Get } from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Controller('invoice')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Get('/status')
  public checkStatus(): void {
    this.invoiceService.checkStatus();
  }

  @Get('/emit')
  public emitInvoice(): void {
    this.invoiceService.emitInvoice();
  }
}
