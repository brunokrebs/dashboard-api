import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';

import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { InventoryService } from '../inventory/inventory.service';
import { BlingService } from '../bling/bling.service';
import { SupplierService } from '../supplier/supplier.service';
import { Supplier } from '../supplier/supplier.entity';
import { InventoryMovementDTO } from '../inventory/inventory-movement.dto';
import { ProductsService } from '../products/products.service';
import { IPaginationOpts } from '../pagination/pagination';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { PurchaseOrderStatus } from './purchase-order.enum';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { UpdatePurchaseOrderStatusDTO } from './update-purchase-order-status.dto';
import { Propagation, Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(ProductVariation)
    private productVariationRepository: Repository<ProductVariation>,
    private inventoryService: InventoryService,
    private productsService: ProductsService,
    private supplierService: SupplierService,
    private blingService: BlingService,
  ) {}

  @Cron('0 45 * * * *')
  @Transactional()
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

  @Transactional({ propagation: Propagation.REQUIRED })
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
      status: PurchaseOrderStatus.COMPLETED,
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
    const queryBuilder = this.purchaseOrderRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 's')
      .leftJoinAndSelect('po.items', 'poi')
      .leftJoinAndSelect('poi.productVariation', 'pv');

    let orderColumn = '';
    switch (options.sortedBy?.trim()) {
      case undefined:
      case null:
      case '':
      case 'creationDate':
        orderColumn = 'po.creationDate';
        break;
      case 'referenceCode':
        orderColumn = 'po.referenceCode';
        break;
      case 'total':
        orderColumn = 'po.total';
        break;
      case 'supplier':
        orderColumn = 's.name';
        break;
      default:
        orderColumn = 'po.creationDate';
    }

    options.queryParams
      .filter(queryParam => {
        return (
          queryParam !== null &&
          queryParam.value !== null &&
          queryParam.value !== undefined
        );
      })
      .forEach(queryParam => {
        switch (queryParam.key) {
          case 'query':
            queryBuilder.andWhere(
              new Brackets(qb => {
                qb.where(`lower(po.referenceCode) like lower(:query)`, {
                  query: `%${queryParam.value.toString()}%`,
                })
                  .orWhere(`lower(s.name) like lower(:query)`, {
                    query: `%${queryParam.value.toString()}%`,
                  })
                  .orWhere(`lower(s.cnpj) like lower(:query)`, {
                    query: `%${queryParam.value.toString()}%`,
                  });
              }),
            );
            break;
        }
      });

    let sortDirection;
    let sortNulls;
    switch (options.sortDirectionAscending) {
      case undefined:
      case null:
      case true:
        sortDirection = 'DESC';
        sortNulls = 'NULLS FIRST';
        break;
      default:
        sortDirection = 'ASC';
        sortNulls = 'NULLS LAST';
    }

    queryBuilder.orderBy(orderColumn, sortDirection, sortNulls);
    return paginate<PurchaseOrder>(queryBuilder, options);
  }

  @Transactional()
  async save(purchaseOrder: PurchaseOrder) {
    const itemsTotal = purchaseOrder.items
      .map(item => {
        if (item.amount < 1)
          throw new Error('product amount can not is smaller 1');
        return item.price * item.amount;
      })
      .reduce((previousAmount, itemAmount) => previousAmount + itemAmount, 0);
    purchaseOrder.total =
      itemsTotal + purchaseOrder.shippingPrice - purchaseOrder.discount;

    if (purchaseOrder.total < 0) {
      throw new Error('total can not is smaller 0');
    }

    if (!purchaseOrder.id) purchaseOrder.creationDate = new Date();

    const persistedOrder = await this.purchaseOrderRepository.save(
      purchaseOrder,
    );

    const { id } = purchaseOrder;
    await this.purchaseOrderItemRepository
      .createQueryBuilder()
      .delete()
      .from(PurchaseOrderItem)
      .where(`purchase_order_id = :id`, { id })
      .execute();

    const productVariations = await this.productVariationRepository.find({
      sku: In(purchaseOrder.items.map(item => item.productVariation.sku)),
    });

    const purchaseOrderItems = purchaseOrder.items.map(item => ({
      ...item,
      productVariation: productVariations.find(
        pv => pv.sku === item.productVariation.sku,
      ),
      purchaseOrder: persistedOrder,
      amount: item.amount,
      ipi: item.ipi,
    }));
    return this.purchaseOrderItemRepository.save(purchaseOrderItems);
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

    order.items = items.map(item => ({
      price: item.price,
      amount: item.amount,
      productVariation: item.productVariation,
      sku: item.productVariation.sku,
      currentPosition: item.productVariation.currentPosition,
      description: item.productVariation.description,
      completeDescription: `${item.productVariation.sku} - ${item.productVariation.product.title} (${item.productVariation.description})`,
      ipi: item.ipi,
    }));
    return order;
  }

  @Transactional()
  async updateStatus(updatedPurchaseOrderStatus: UpdatePurchaseOrderStatusDTO) {
    const { referenceCode, status } = updatedPurchaseOrderStatus;
    const purchaseOrder = await await this.purchaseOrderRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.items', 'poi')
      .leftJoinAndSelect('poi.productVariation', 'pv')
      .where(`po.reference_code = :referenceCode`, { referenceCode })
      .getOne();

    if (status === purchaseOrder.status) {
      return;
    }

    // set the new status
    await this.purchaseOrderRepository.update(purchaseOrder.id, {
      status,
      completionDate:
        status === PurchaseOrderStatus.COMPLETED ? new Date() : null,
    });

    if (status !== PurchaseOrderStatus.COMPLETED) {
      // remove previous movements, if any
      await this.inventoryService.cleanUpMovements(null, purchaseOrder);
    } else {
      // create the new movements
      const insertMovementJobs = purchaseOrder.items
        .map(poi => ({
          sku: poi.productVariation.sku,
          amount: poi.amount,
          description: `Movimentação gerada pela ordem de compra ${purchaseOrder.id}.`,
        }))
        .map(movement =>
          this.inventoryService.saveMovement(
            movement,
            null,
            null,
            purchaseOrder,
          ),
        );
      await Promise.all(insertMovementJobs);
    }
  }
}
