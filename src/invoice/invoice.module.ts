import { HttpModule, Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService],
  imports: [HttpModule],
})
export class InvoiceModule {}
