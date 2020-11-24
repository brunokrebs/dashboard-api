import { MigrationInterface, QueryRunner } from 'typeorm';

export class calcularTotalPurchaseOrder1606221222747
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE purchase_order SET total = (subquery.total-purchase_order.discount) FROM
            (SELECT poi.purchase_order_id,sum(TRUNC(
                    price*amount,
                    2))as total   FROM purchase_order_item as poi 
                             GROUP BY poi.purchase_order_id 
                             ORDER BY poi.purchase_order_id) as subquery 
                    WHERE purchase_order.id=subquery.purchase_order_id;`,
    );
    await queryRunner.query("UPDATE purchase_order SET status = 'COMPLETED'");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('UPDATE purchase_order SET status = null');
    await queryRunner.query('UPDATE purchase_order SET total =null');
  }
}
