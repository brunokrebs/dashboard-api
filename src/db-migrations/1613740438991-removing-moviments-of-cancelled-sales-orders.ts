import { MigrationInterface, QueryRunner } from 'typeorm';

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

    await queryRunner.query(
      `DELETE FROM inventory_movement im WHERE id in (
          SELECT im.id FROM inventory_movement im 
            LEFT JOIN sale_order so on so.id = im.sale_order_id 
            WHERE so.payment_status = 'CANCELLED')`,
    );

    const updateInventoryJob = fixIventoryQuantity.map(async i => {
      const currentPosition = i.currentPosition + i.amount;
      await queryRunner.query(`
            UPDATE inventory SET current_position=${currentPosition}
                WHERE id=${i.inventoryId};
        `);
      await queryRunner.query(`
        UPDATE product_variation SET current_position=${currentPosition}
            WHERE id=${i.productVariation};
        `);
    });

    await Promise.all(updateInventoryJob);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
