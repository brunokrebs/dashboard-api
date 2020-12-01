import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { BlingModule } from '../bling/bling.module';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { SupplierModule } from '../supplier/supplier.module';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    BlingModule,
    ProductsModule,
    InventoryModule,
    SupplierModule,
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderItem,
      ProductVariation,
      Product,
    ]),
  ],
  providers: [PurchaseOrderService],
  controllers: [PurchaseOrderController],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
