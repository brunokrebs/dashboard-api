import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { BlingModule } from '../bling/bling.module';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

@Module({
  imports: [
    BlingModule,
    ProductsModule,
    InventoryModule,
    TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderItem]),
  ],
})
export class PurchaseOrderModule {}
