import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { Image } from './media-library/image.entity';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entities/product.entity';
import { ProductVariation } from './products/entities/product-variation.entity';
import { MediaLibraryModule } from './media-library/media-library.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { TagsModule } from './tags/tags.module';
import { Tag } from './tags/tag.entity';
import { ProductImage } from './products/entities/product-image.entity';
import { InventoryModule } from './inventory/inventory.module';
import { Inventory } from './inventory/inventory.entity';
import { InventoryMovement } from './inventory/inventory-movement.entity';
import { CustomersModule } from './customers/customers.module';
import { Customer } from './customers/customer.entity';
import { SalesOrderModule } from './sales-order/sales-order.module';
import { SaleOrderItem } from './sales-order/entities/sale-order-item.entity';
import { SaleOrder } from './sales-order/entities/sale-order.entity';
import { BlingModule } from './bling/bling.module';
import { ProductComposition } from './products/entities/product-composition.entity';
import { MarketplacesModule } from './marketplaces/marketplaces.module';
import { KeyValuePair } from './key-value-pair/key-value-pair.entity';
import { KeyValuePairModule } from './key-value-pair/key-value-pair.module';
import { ChartModule } from './chart/chart.module';
import { PurchaseOrder } from './purchase-order/purchase-order.entity';
import { PurchaseOrderItem } from './purchase-order/purchase-order-item.entity';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { Supplier } from './supplier/supplier.entity';
import { SupplierModule } from './supplier/supplier.module';
import { SendgridModule } from './sendgrid/sendgrid.module';
import { InvoiceModule } from './invoice/invoice.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [
        Customer,
        Inventory,
        InventoryMovement,
        KeyValuePair,
        PurchaseOrder,
        PurchaseOrderItem,
        Product,
        ProductComposition,
        ProductVariation,
        ProductImage,
        Image,
        User,
        SaleOrder,
        SaleOrderItem,
        Supplier,
        Tag,
      ],
      synchronize: false,
      migrationsTableName: 'database_migrations',
      migrations: ['src/db-migrations/*.js'],
      cli: {
        migrationsDir: 'src/db-migrations',
      },
      logging: !!process.env.LOG_SQL_QUERIES,
      ssl: process.env.NODE_ENV !== 'development' &&
        process.env.NODE_ENV !== 'test' && {
          rejectUnauthorized: false,
        },
    }),
    ScheduleModule.forRoot(),
    ProductsModule,
    MediaLibraryModule,
    AuthModule,
    UsersModule,
    TagsModule,
    InventoryModule,
    CustomersModule,
    SalesOrderModule,
    SupplierModule,
    PurchaseOrderModule,
    BlingModule,
    MarketplacesModule,
    KeyValuePairModule,
    ChartModule,
    SendgridModule,
    InvoiceModule,
  ],
})
export class AppModule {}
