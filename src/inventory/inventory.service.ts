import { Injectable } from '@nestjs/common';
import { Pagination, paginate } from 'nestjs-typeorm-paginate';
import { minBy } from 'lodash';

import * as XLSX from 'xlsx';

import { Inventory } from './inventory.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { IPaginationOpts } from '../pagination/pagination';
import { InventoryMovementDTO } from './inventory-movement.dto';
import { SaleOrder } from '../sales-order/entities/sale-order.entity';
import { SaleOrderItem } from '../sales-order/entities/sale-order-item.entity';
import { ProductVariation } from '../products/entities/product-variation.entity';
import { Product } from '../products/entities/product.entity';
import { ProductComposition } from '../products/entities/product-composition.entity';
import { PurchaseOrder } from '../purchase-order/purchase-order.entity';
import { Propagation, Transactional } from 'typeorm-transactional-cls-hooked';
import { ProductCategory } from '../products/entities/product-category.enum';
import { PaymentStatus } from '../sales-order/entities/payment-status.enum';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryMovement)
    private inventoryMovementRepository: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariation)
    private productVariationRepository: Repository<ProductVariation>,
    @InjectRepository(ProductComposition)
    private productCompositionRepository: Repository<ProductComposition>,
    @InjectRepository(SaleOrderItem)
    private saleOrderItemRepository: Repository<SaleOrderItem>,
  ) {}

  async paginate(options: IPaginationOpts): Promise<Pagination<Inventory>> {
    const queryBuilder = this.inventoryRepository.createQueryBuilder('i');

    queryBuilder
      .leftJoinAndSelect('i.productVariation', 'pv')
      .leftJoinAndSelect('pv.product', 'p');

    let orderColumn = '';

    switch (options.sortedBy?.trim()) {
      case undefined:
      case null:
      case 'sku':
        orderColumn = 'pv.sku';
        break;
      case 'currentPosition':
        orderColumn = 'i.currentPosition';
        break;
      case 'title':
        orderColumn = 'p.title';
        break;
      default:
        orderColumn = options.sortedBy;
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
                qb.where(`lower(pv.sku) like lower(:query)`, {
                  query: `%${queryParam.value.toString()}%`,
                }).orWhere(`lower(p.title) like lower(:query)`, {
                  query: `%${queryParam.value.toString()}%`,
                });
              }),
            );
            break;
          case 'category':
            queryBuilder.andWhere(
              new Brackets(qb => {
                qb.where(`p.category = :category`, {
                  category: queryParam.value,
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
        sortDirection = 'ASC';
        sortNulls = 'NULLS FIRST';
        break;
      default:
        sortDirection = 'DESC';
        sortNulls = 'NULLS LAST';
    }

    queryBuilder.orderBy(orderColumn, sortDirection, sortNulls);

    return paginate<Inventory>(queryBuilder, options);
  }

  findById(id: number): Promise<Inventory> {
    return this.inventoryRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.movements', 'm')
      .leftJoinAndSelect('i.productVariation', 'pv')
      .leftJoinAndSelect('pv.product', 'p')
      .where({ id })
      .orderBy('m.created', 'DESC')
      .getOne();
  }

  findByVariationIds(ids: number[]): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      where: {
        productVariation: In(ids),
      },
    });
  }

  findBySku(sku: string): Promise<Inventory> {
    return this.inventoryRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.productVariation', 'p')
      .where('p.sku = :sku', { sku })
      .getOne();
  }

  @Transactional({ propagation: Propagation.MANDATORY })
  async cleanUpMovements(saleOrder?: SaleOrder, purchaseOrder?: PurchaseOrder) {
    // finds all movements related to a sale order or a purchase order
    const query = saleOrder ? { saleOrder } : { purchaseOrder };
    const movements = await this.inventoryMovementRepository
      .createQueryBuilder('im')
      .leftJoinAndSelect('im.inventory', 'i')
      .leftJoinAndSelect('i.productVariation', 'pv')
      .where(query)
      .getMany();

    // removes movements and update current position
    const removeMovementJobs = movements.map(async movement => {
      // update current position on inventory
      const inventory: Inventory = movement.inventory;
      inventory.currentPosition -= movement.amount;
      await this.inventoryRepository.save(inventory);

      // update current position on product variation
      const productVariation = inventory.productVariation;
      productVariation.currentPosition -= movement.amount;
      await this.productVariationRepository.save(productVariation);

      // remove inventory movements
      await this.inventoryMovementRepository.delete(movement.id);
    });

    await Promise.all(removeMovementJobs);
  }

  async removeInventoryAndMovements(productVariations: ProductVariation[]) {
    const removeJobs = productVariations.map(productVariation => {
      return new Promise<void>(async res => {
        const inventory = await this.inventoryRepository.findOne({
          where: { productVariation },
        });
        await this.inventoryMovementRepository
          .createQueryBuilder()
          .delete()
          .from(InventoryMovement)
          .where(`inventory_id = ${inventory.id}`)
          .execute();
        await this.inventoryRepository.delete(inventory);
        res();
      });
    });
    await Promise.all(removeJobs);
  }

  @Transactional()
  async createNewMovement(inventoryMovementDTO: InventoryMovementDTO) {
    return this.saveMovement(inventoryMovementDTO);
  }

  @Transactional({ propagation: Propagation.MANDATORY })
  async saveMovement(
    inventoryMovementDTO: InventoryMovementDTO,
    saleOrder?: SaleOrder,
    isCreatingCompositeProduct?: boolean,
    purchaseOrder?: PurchaseOrder,
  ): Promise<InventoryMovement> {
    if (saleOrder && purchaseOrder) {
      throw new Error('Choose either a sales or a purchase order');
    }

    // 1. check if this is a composite product
    if (!isCreatingCompositeProduct && inventoryMovementDTO.amount > 0) {
      const product = await this.productRepository
        .createQueryBuilder('p')
        .leftJoin('p.productVariations', 'pv')
        .leftJoinAndSelect('p.productComposition', 'pc')
        .where('pv.sku = :sku', {
          sku: inventoryMovementDTO.sku,
        })
        .getOne();

      if (product.productComposition.length > 0) {
        throw new Error('Cannot increase inventory for composite products.');
      }
    }

    // 2. update product position and persist movement
    const inventoryMovement = await this.moveProduct(
      inventoryMovementDTO,
      saleOrder,
      purchaseOrder,
    );

    // 3. if this product is part of compositions, update them
    await this.updateDependentProducts(
      inventoryMovement.inventory,
      saleOrder,
      inventoryMovementDTO,
    );

    // 4. if this product is a composite product, update its parts
    await this.updatePartsOfComposition(inventoryMovementDTO, saleOrder);
    return inventoryMovement;
  }

  private async moveProduct(
    inventoryMovementDTO: InventoryMovementDTO,
    saleOrder: SaleOrder,
    purchaseOrder?: PurchaseOrder,
  ) {
    const inventory = await this.findBySku(inventoryMovementDTO.sku);

    // 1. updating inventory current position
    inventory.currentPosition += inventoryMovementDTO.amount;
    await this.inventoryRepository.save(inventory);

    // 2. updating product variation current position
    await this.productVariationRepository.update(
      {
        sku: inventoryMovementDTO.sku,
      },
      {
        currentPosition: inventory.currentPosition,
      },
    );

    // 3. persist movement
    const movement: InventoryMovement = {
      inventory,
      amount: inventoryMovementDTO.amount,
      description: inventoryMovementDTO.description,
      saleOrder: saleOrder,
      purchaseOrder: purchaseOrder,
    };

    return await this.inventoryMovementRepository.save(movement);
  }

  private async updatePartsOfComposition(
    inventoryMovementDTO: InventoryMovementDTO,
    saleOrder: SaleOrder,
  ) {
    if (inventoryMovementDTO.amount > 0) {
      // the only way to increase a composition's inventory, is by increasing
      // the inventory of one or more of its parts
      return;
    }

    const productCompositions: ProductComposition[] = await this.productCompositionRepository
      .createQueryBuilder('pc')
      .leftJoinAndSelect('pc.productVariation', 'pv')
      .leftJoin('pc.product', 'p')
      // either p.sku or pv.sku should work
      // on product compositions they should be the same
      .where('p.sku = :sku', { sku: inventoryMovementDTO.sku })
      .getMany();

    if (!productCompositions || productCompositions.length === 0) return;

    const partsOfComposition: ProductVariation[] = productCompositions.map(
      pc => pc.productVariation,
    );

    await Promise.all(
      partsOfComposition.map(async part => {
        const movement: InventoryMovementDTO = {
          ...inventoryMovementDTO,
          sku: part.sku,
        };
        await this.moveProduct(movement, saleOrder);
      }),
    );
  }

  private async updateDependentProducts(
    inventory: Inventory,
    saleOrder: SaleOrder,
    inventoryMovementDTO: InventoryMovementDTO,
  ) {
    const dependentProducts: Product[] = await this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.productComposition', 'pc')
      .leftJoinAndSelect('p.productVariations', 'pv')
      .where('pc.productVariation = :productVariation', {
        productVariation: inventory.productVariation.id,
      })
      .getMany();

    if (dependentProducts && dependentProducts.length > 0) {
      // This scenario means that there are composite products that use the product variation
      // being moved. As such, we might need to update their inventory to reflect the new reality.
      const updateCompositionJobs = dependentProducts.map(
        async (dependentProduct: Product) => {
          await this.updateDependentProductCompositionInventories(
            dependentProduct,
            saleOrder,
            inventoryMovementDTO.description,
          );
        },
      );
      await Promise.all(updateCompositionJobs);
    }
  }

  private async updateDependentProductCompositionInventories(
    product: Product,
    saleOrder: SaleOrder,
    description: string,
  ) {
    // step 1: find the variations
    const composition = await this.productCompositionRepository
      .createQueryBuilder('pc')
      .leftJoinAndSelect('pc.productVariation', 'pv')
      .where('pc.product = :productId', { productId: product.id })
      .getMany();
    const parts = composition.map(pc => pc.productVariation);

    // step 2: check the min inventory of these parts
    const minInventory = minBy(parts, part => part.currentPosition);

    // step 3: calc the amount to be updated
    const amountMoved =
      minInventory.currentPosition -
      product.productVariations[0].currentPosition;

    if (amountMoved === 0) return; // no change, abort

    const productCompositionInventory = await this.inventoryRepository.findOneOrFail(
      {
        productVariation: product.productVariations[0],
      },
    );

    const inventoryMovementDTO: InventoryMovementDTO = {
      sku: product.sku,
      amount:
        minInventory.currentPosition -
        productCompositionInventory.currentPosition,
      description: description,
    };

    return await this.moveProduct(inventoryMovementDTO, saleOrder);
  }

  save(inventory: Inventory): Promise<Inventory> {
    return this.inventoryRepository.save(inventory);
  }

  async eraseCurrentPosition(sku: string) {
    const inventory = await this.findBySku(sku);
    inventory.currentPosition = 0;
    return this.inventoryRepository.save(inventory);
  }

  //export to xls
  async exportXls(category: ProductCategory) {
    // get inventory info for all product variations ordered by ncm
    const reportData = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoin('inventory.productVariation', 'productVariation')
      .leftJoin('productVariation.product', 'product')
      .select([
        'productVariation.sku as SKU',
        'product.title as Titulo',
        'product.ncm as NCM',
        'product.category as Categoria',
        'productVariation.description as Tamanho',
        'inventory.current_position as Disponivel',
      ]);

    if (category) reportData.where('product.category= :category', { category });

    const inventory = await reportData.orderBy('product.ncm').getRawMany();

    const inProcessOrders = this.saleOrderItemRepository
      .createQueryBuilder('soi')
      .leftJoin('soi.saleOrder', 'so')
      .leftJoin('soi.productVariation', 'pv')
      .leftJoin('pv.product', 'product')
      .select('soi.amount,so.id,pv.sku')
      .where('so.paymentStatus = :paymentSatus', {
        paymentSatus: PaymentStatus.IN_PROCESS,
      });

    if (category)
      inProcessOrders.andWhere('product.category= :category', { category });

    const blockedStock = await inProcessOrders.getRawMany();

    //the name of the variables is in Portuguese because it is the name that appears in xls
    const reportResults = inventory.map(i => {
      if (i.tamanho === 'Tamanho Único') {
        i.tamanho = '';
      }
      const separado = blockedStock
        .filter(orderItem => orderItem.sku === i.sku)
        .reduce((amountTotal, orderItem) => {
          return (amountTotal += parseInt(orderItem.amount));
        }, 0);
      const total = i.disponivel + separado;
      return { ...i, separado, total };
    });

    return this.generateXLSX(reportResults);
  }

  generateXLSX(data) {
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: 'Relatório de Estoque',
      CreatedDate: new Date(),
    };
    const workSheet = XLSX.utils.json_to_sheet(data);

    const wscols = [
      { wch: 10 }, // "width por characters"
      { wch: 20 },
      { wch: 50 },
      { wch: 25 },
      { wch: 10 },
    ];

    workSheet['!cols'] = wscols;
    XLSX.utils.book_append_sheet(wb, workSheet, 'Estoque');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
