import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { parseBoolean } from '../util/parsers';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Supplier } from './supplier.entity';
import { SupplierService } from './supplier.service';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private supplierService: SupplierService) {}

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortedBy') sortedBy: string,
    @Query('sortDirectionAscending') sortDirectionAscending: string,
    @Query('query') query: string,
  ): Promise<Pagination<Supplier>> {
    return this.supplierService.paginate({
      page,
      limit,
      sortedBy,
      sortDirectionAscending: parseBoolean(sortDirectionAscending),
      queryParams: [
        {
          key: 'query',
          value: query,
        },
      ],
    });
  }

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
