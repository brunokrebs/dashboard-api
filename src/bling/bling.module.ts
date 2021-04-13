import { Module, HttpModule } from '@nestjs/common';
import { BlingService } from './bling.service';
import { BlingController } from './bling.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { Inventory } from '../inventory/inventory.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductComposition } from '../products/entities/product-composition.entity';

@Module({
  imports: [
    InventoryModule,
    HttpModule,
    TypeOrmModule.forFeature([
      Product,
      ProductVariation,
      ProductComposition,
      Inventory,
    ]),
  ],
  providers: [BlingService],
  exports: [BlingService],
  controllers: [BlingController],
})
export class BlingModule {}
