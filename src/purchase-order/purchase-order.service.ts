import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';

import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { InventoryService } from '../inventory/inventory.service';
import { BlingService } from '../bling/bling.service';
import { SupplierService } from '../supplier/supplier.service';
import { Supplier } from '../supplier/supplier.entity';
import { InventoryMovementDTO } from '../inventory/inventory-movement.dto';
import { ProductsService } from '../products/products.service';
import { IPaginationOpts } from 'src/pagination/pagination';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    private inventoryService: InventoryService,
    private productsService: ProductsService,
    private supplierService: SupplierService,
    private blingService: BlingService,
  ) {}

  //@Cron('0 45 22 * * *')
  async syncPurchaseOrdersWithBling() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    )
      return;
    const blingPurchaseOrders = await this.blingService.loadPurchaseOrders();
    const persistedSuppliers = await this.syncSuppliers(blingPurchaseOrders);

    const persistJobs = blingPurchaseOrders.map(bpo => {
      return this.persistPurchaseOrderFromBling(bpo, persistedSuppliers);
    });
    await Promise.all(persistJobs);
  }

  private async persistPurchaseOrderFromBling(
    blingPurchaseOrder: any,
    persistedSuppliers: Supplier[],
  ) {
    // checking if the purchase order has already been created
    const alreadyExists = await this.purchaseOrderRepository.findOne({
      referenceCode: blingPurchaseOrder.numeropedido,
    });

    if (alreadyExists) {
      return;
    }

    // finding the supplier
    const supplier = persistedSuppliers.find(
      s => s.cnpj === blingPurchaseOrder.fornecedor.cpfcnpj.replace(/\D/g, ''),
    );

    // loading product variations listed on the Bling purchase order
    const skus = blingPurchaseOrder.itens.map(({ item }) => item.codigo);
    const productVariations = await this.productsService.findVariationsBySkus(
      skus,
    );

    // creating the purchase order details
    const purchaseOrder: PurchaseOrder = {
      referenceCode: blingPurchaseOrder.numeropedido,
      creationDate: new Date(),
      completionDate: new Date(),
      supplier: supplier,
      discount: parseFloat(blingPurchaseOrder.desconto.replace(',', '.')),
      shippingPrice: blingPurchaseOrder.transporte.frete,
      items: [],
    };

    // saving the purchase order
    const persistedOrder = await this.purchaseOrderRepository.save(
      purchaseOrder,
    );

    // mapping the purchase order items
    const purchaseOrderItems: PurchaseOrderItem[] = blingPurchaseOrder.itens.map(
      ({ item }) => ({
        productVariation: productVariations.find(pv => pv.sku === item.codigo),
        purchaseOrder: persistedOrder,
        price: item.valor,
        amount: item.qtde,
        ipi: 0,
      }),
    );

    // saving the items
    await this.purchaseOrderItemRepository.save(purchaseOrderItems);

    // defining the movements
    const movements: InventoryMovementDTO[] = purchaseOrderItems.map(poi => ({
      sku: poi.productVariation.sku,
      amount: poi.amount,
      description: `Movimentação gerada pela ordem de compra ${persistedOrder.referenceCode}.`,
    }));

    // persisting the movements to make sure inventory is up to date
    const insertMovementJobs = movements.map(movement =>
      this.inventoryService.saveMovement(movement),
    );
    await Promise.all(insertMovementJobs);
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

  async paginate(options: IPaginationOpts): Promise<Pagination<PurchaseOrder>> {
    let sortDirection;
    let sortNulls;
    let orderColumn = '';

    switch (options.sortedBy?.trim()) {
      case undefined:
      case null:
      case '':
      case 'referenceCode':
        orderColumn = 'reference_code';
        break;
      case 'creationDate':
        orderColumn = 'creation_date';
        break;
      case 'discount':
        orderColumn = 'discount';
        break;
      case 'shippingPrice':
        orderColumn = 'shipping_price';
        break;
      default:
        orderColumn = options.sortedBy;
    }

    switch (options.sortDirectionAscending) {
      case undefined:
      case null:
      case true:
        sortDirection = 'ASC';
        sortNulls = 'NULLS FIRST';
        break;
      default:
        sortDirection = 'DESC';
        sortNulls = 'NULLS LAST';
    }

    const queryBuilder = this.purchaseOrderRepository
      .createQueryBuilder('po')
      .orderBy(orderColumn, sortDirection, sortNulls);

    return paginate<PurchaseOrder>(queryBuilder, options);
  }

  async save(purchaseOrder: PurchaseOrder) {
    const persistedOrder = await this.purchaseOrderRepository.save(
      purchaseOrder,
    );
    await this.purchaseOrderItemRepository
      .createQueryBuilder()
      .delete()
      .from(PurchaseOrderItem)
      .where(`purchase_order_id = :purchase_order_id`, {
        purchase_order_id: purchaseOrder.id,
      })
      .execute();

    const purchaseOrderItems: PurchaseOrderItem[] = purchaseOrder.items.map(
      item => {
        return {
          ...item,
          purchaseOrder: persistedOrder,
          ipi: 0,
        };
      },
    );

    await this.purchaseOrderItemRepository.save(purchaseOrderItems);
    return;
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findOne({
      where: { id },
      relations: ['supplier'],
    });

    const items: PurchaseOrderItem[] = await this.purchaseOrderItemRepository
      .createQueryBuilder('poi')
      .leftJoinAndSelect('poi.productVariation', 'pv')
      .leftJoinAndSelect('pv.product', 'product')
      .where('poi.purchase_order_id = :id', { id })
      .getMany();

    const purchaseOrderItems: PurchaseOrderItem[] = items.map(item => {
      return {
        price: item.price,
        amount: item.amount,
        productVariation: item.productVariation,
        completeDescription: `${item.productVariation.sku} - ${item.productVariation.product.title} (${item.productVariation.description})`,
        ipi: 0,
      };
    });
    order.items = purchaseOrderItems;
    return order;
  }
}
