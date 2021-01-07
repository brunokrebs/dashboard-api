import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterTableSaleOrderAddColumnShippingId1610048807980
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE sale_order ADD COLUMN ml_shipping_id varchar(30);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE sale_order DROP COLUMN ml_shipping_id;`,
    );
  }
}
