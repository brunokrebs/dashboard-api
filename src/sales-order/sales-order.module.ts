import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleOrder } from './entities/sale-order.entity';
import { SaleOrderItem } from './entities/sale-order-item.entity';
import { SalesOrderController } from './sales-order.controller';
import { SalesOrderService } from './sales-order.service';
import { ProductsModule } from '../products/products.module';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { BlingModule } from '../bling/bling.module';
import { SalesOrderReportsService } from './sales-order-reports.service';
import { ProductVariation } from '../products/entities/product-variation.entity';

@Module({
  imports: [
    BlingModule,
    ProductsModule,
    CustomersModule,
    InventoryModule,
    TypeOrmModule.forFeature([SaleOrder, SaleOrderItem, ProductVariation]),
  ],
  providers: [SalesOrderService, SalesOrderReportsService],
  controllers: [SalesOrderController],
  exports: [SalesOrderService],
})
export class SalesOrderModule {}
