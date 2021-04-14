import { Module, HttpModule } from '@nestjs/common';
import { BlingService } from './bling.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { Inventory } from '../inventory/inventory.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductComposition } from '../products/entities/product-composition.entity';
import { SaleOrder } from '../sales-order/entities/sale-order.entity';
import { SaleOrderItem } from '../sales-order/entities/sale-order-item.entity';
@Module({
  imports: [
    InventoryModule,
    HttpModule,
    TypeOrmModule.forFeature([
      Product,
      ProductVariation,
      ProductComposition,
      Inventory,
      SaleOrder,
      SaleOrderItem,
    ]),
  ],
  providers: [BlingService],
  exports: [BlingService],
})
export class BlingModule {}
