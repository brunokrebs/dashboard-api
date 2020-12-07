import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { parseBoolean } from '../util/parsers';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderService } from './purchase-order.service';
import { UpdatePurchaseOrderStatusDTO } from './update-purchase-order-status.dto';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class PurchaseOrderController {
  constructor(private purchaseOrderService: PurchaseOrderService) {}

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortedBy') sortedBy: string,
    @Query('sortDirectionAscending') sortDirectionAscending: string,
    @Query('query') query: string,
  ): Promise<Pagination<PurchaseOrder>> {
    return await this.purchaseOrderService.paginate({
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

  @Post()
  savePurchaseOrder(@Body() purchaseOrder: PurchaseOrder) {
    return this.purchaseOrderService.save(purchaseOrder);
  }

  @Get(':referenceCode')
  findOne(
    @Param('referenceCode') referenceCode: string,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrderService.findOne(referenceCode);
  }

  @Put()
  updateStatus(
    @Body() updatePurchaseOrderStatus: UpdatePurchaseOrderStatusDTO,
  ) {
    return this.purchaseOrderService.updateStatus(updatePurchaseOrderStatus);
  }
}
