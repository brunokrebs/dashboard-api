import { HttpModule, Module } from '@nestjs/common';
import { AppLogger } from '../logger/app-logger.service';
import { CustomersModule } from '../customers/customers.module';
import { SendgridService } from './sendgrid.service';

@Module({
  imports: [HttpModule, CustomersModule],
  controllers: [],
  providers: [SendgridService, AppLogger],
})
export class SendgridModule {}
