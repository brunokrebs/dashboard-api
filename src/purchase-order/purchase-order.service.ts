import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { InventoryService } from '../inventory/inventory.service';
import { BlingService } from '../bling/bling.service';

@Injectable()
export class SalesOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private salesOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private salesOrderItemRepository: Repository<PurchaseOrderItem>,
    private inventoryService: InventoryService,
    private blingService: BlingService,
  ) {}

  async loadPurchaseOrdersFromBling() {
    // todo
  }
}
