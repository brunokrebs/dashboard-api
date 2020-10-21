import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Supplier } from './supplier.entity';
import { SupplierService } from './supplier.service';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private supplierService: SupplierService) {}

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Supplier> {
    return this.supplierService.findById(id);
  }

  @Post('/')
  async save(@Body() supplier: Supplier): Promise<Supplier> {
    return this.supplierService.findOrCreate(supplier);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() supplier: Supplier,
  ): Promise<Supplier> {
    return this.supplierService.update(id, supplier);
  }
}
