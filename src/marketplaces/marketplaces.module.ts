import { HttpModule, Module } from '@nestjs/common';
import { ShopifyController } from './shopify/shopify.controller';
import { ShopifyService } from './shopify/shopify.service';
import { ProductsModule } from '../products/products.module';
import { MercadoLivreController } from './mercado-livre/mercado-livre.controller';
import { MercadoLivreService } from './mercado-livre/mercado-livre.service';
import { KeyValuePairModule } from '../key-value-pair/key-value-pair.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MLProduct } from './mercado-livre/mercado-livre.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    HttpModule,
    ProductsModule,
    KeyValuePairModule,
    TypeOrmModule.forFeature([MLProduct, Product]),
  ],
  controllers: [ShopifyController, MercadoLivreController],
  providers: [ShopifyService, MercadoLivreService],
})
export class MarketplacesModule {}
