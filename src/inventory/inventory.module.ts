import { Module, forwardRef } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './inventory.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { ProductsModule } from '../products/products.module';
import { Product } from '../products/entities/product.entity';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { ProductComposition } from '../products/entities/product-composition.entity';
import { SaleOrderItem } from '../sales-order/entities/sale-order-item.entity';

@Module({
  imports: [
    forwardRef(() => ProductsModule),
    TypeOrmModule.forFeature([
      Inventory,
      InventoryMovement,
      Product,
      ProductComposition,
      ProductVariation,
      SaleOrderItem,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
