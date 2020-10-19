import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { InventoryService } from '../inventory/inventory.service';
import { BlingService } from '../bling/bling.service';
import { SupplierService } from '../supplier/supplier.service';
import { Supplier } from '../supplier/supplier.entity';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    private inventoryService: InventoryService,
    private supplierService: SupplierService,
    private blingService: BlingService,
  ) {}

  async loadPurchaseOrdersFromBling() {
    const blingPurchaseOrders = await this.blingService.loadPurchaseOrders();
    const persistedSuppliers = await this.syncSuppliers(blingPurchaseOrders);

    const purchaseOrders = blingPurchaseOrders.map(bpo => {
      return this.mapPurchaseOrderFromBling(bpo, persistedSuppliers);
    });

    await Promise.all(
      purchaseOrders.map(p => this.purchaseOrderRepository.save(p)),
    );
  }

  private mapPurchaseOrderFromBling(
    blingPurchaseOrder: any,
    persistedSuppliers: Supplier[],
  ): PurchaseOrder {
    const supplier = persistedSuppliers.find(
      s => s.cnpj === blingPurchaseOrder.fornecedor.cpfcnpj.replace(/\D/g, ''),
    );
    return {
      referenceCode: null,
      items: null,
      discount: null,
      shippingPrice: null,
      supplier,
    };
  }

  private async syncSuppliers(purchaseOrders) {
    const suppliers = purchaseOrders.map(p => p.fornecedor);
    const suppliersCNPJ = purchaseOrders.map(p =>
      p.fornecedor.cpfcnpj.replace(/\D/g, ''),
    );

    // finding the suppliers that already exist
    const persistedSuppliers = await this.supplierService.findByCNPJs(
      suppliersCNPJ,
    );
    const persistedSuppliersCNPJ = persistedSuppliers.map(s => s.cnpj);

    // inserting new suppliers
    const persistNewSupplierJobs = suppliers
      .filter(
        s => !persistedSuppliersCNPJ.includes(s.cpfcnpj.replace(/\D/g, '')),
      )
      .map(async supplier => {
        const mappedSupplier: Supplier = {
          cnpj: supplier.cpfcnpj.replace(/\D/g, ''),
          name: supplier.nome,
        };
        return await this.supplierService.save(mappedSupplier);
      });
    const newSuppliers: Supplier[] = await Promise.all(persistNewSupplierJobs);

    persistedSuppliers.push(...newSuppliers);
    return persistedSuppliers;
  }
}
