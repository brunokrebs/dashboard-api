import { MigrationInterface, QueryRunner } from 'typeorm';
import { uniqBy } from 'lodash';

export class removingMovimentsOfCancelledSalesOrders1613740438991
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const moviments = await queryRunner.query(`
    SELECT * FROM inventory_movement im 
        LEFT JOIN sale_order so on so.id = im.sale_order_id
        LEFT JOIN inventory i on i.id = im.inventory_id
        WHERE so.payment_status = 'CANCELLED';`);
    const fixIventoryQuantity = moviments.map(moviment => {
      return {
        id: moviment.id,
        inventoryId: moviment.inventory_id,
        productVariation: moviment.product_variation_id,
        currentPosition: moviment.current_position,
        amount: -moviment.amount,
      };
    });

    const filteresMoviments = uniqBy(
      fixIventoryQuantity.map(moviment => {
        const total = fixIventoryQuantity
          .filter(inventory => inventory.inventoryId === moviment.id)
          .reduce((amountTotal, inventory) => {
            return (amountTotal += inventory.amount);
          }, 0);
        return {
          id: moviment.id,
          inventoryId: moviment.inventoryId,
          productVariation: moviment.productVariation,
          currentPosition: moviment.currentPosition,
          amount: total,
        };
      }),
      'inventoryId',
    );

    await queryRunner.query(
      `DELETE FROM inventory_movement im WHERE id in (
          SELECT im.id FROM inventory_movement im 
            LEFT JOIN sale_order so on so.id = im.sale_order_id 
            WHERE so.payment_status = 'CANCELLED')`,
    );

    const updateInventoryJob = filteresMoviments.map(async (inventory: any) => {
      const currentPosition = inventory.currentPosition + inventory.amount;
      await queryRunner.query(`
        UPDATE inventory SET current_position=${currentPosition}
          WHERE id=${inventory.inventoryId};
        `);
      await queryRunner.query(`
        UPDATE product_variation SET current_position=${currentPosition}
          WHERE id=${inventory.productVariation};
        `);
    });

    await Promise.all(updateInventoryJob);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
