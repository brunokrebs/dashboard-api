import { Module, HttpModule } from '@nestjs/common';
import { BlingService } from './bling.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductComposition } from '../products/entities/product-composition.entity';
import { SaleOrder } from '../sales-order/entities/sale-order.entity';

@Module({
  imports: [
    InventoryModule,
    HttpModule,
    TypeOrmModule.forFeature([Product, ProductComposition, SaleOrder]),
  ],
  providers: [BlingService],
  exports: [BlingService],
})
export class BlingModule {}
