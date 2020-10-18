import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './supplier.entity';
import { SupplierService } from './supplier.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SupplierModule {}
