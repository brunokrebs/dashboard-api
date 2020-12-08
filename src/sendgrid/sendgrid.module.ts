import { HttpModule, Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { SendgridService } from './sendgrid.service';

@Module({
  imports: [HttpModule, CustomersModule],
  controllers: [],
  providers: [SendgridService],
})
export class SendgridModule {}
