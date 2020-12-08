import { HttpModule, Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { SendgridController } from './sendgrid.controller';
import { SendgridService } from './sendgrid.service';

@Module({
  imports: [HttpModule, CustomersModule],
  controllers: [SendgridController],
  providers: [SendgridService],
})
export class SendgridModule {}
