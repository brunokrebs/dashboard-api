import { MigrationInterface, QueryRunner } from 'typeorm';

export class calcularTotalPurchaseOrder1606221222747
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE purchase_order
        SET status = 'COMPLETED', total = (subquery.total - purchase_order.discount) FROM (
          SELECT poi.purchase_order_id, sum(price * amount) AS total 
            FROM purchase_order_item as poi 
            GROUP BY poi.purchase_order_id
        ) AS subquery WHERE purchase_order.id = subquery.purchase_order_id;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'UPDATE purchase_order SET status = null, total = null',
    );
  }
}
