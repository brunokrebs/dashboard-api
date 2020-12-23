import { MigrationInterface, QueryRunner } from 'typeorm';

export class addCollumnsInProduct1608722227286 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE product_variation ADD COLUMN ml_variation_id varchar(30);`,
    );

    await queryRunner.query(
      `ALTER TABLE ml_product ADD COLUMN is_synchronized boolean`,
    );

    await queryRunner.query(
      `ALTER TABLE sale_order ADD COLUMN ml_order_id varchar(30)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE product_variation DROP COLUMN ml_variation_id;`,
    );

    await queryRunner.query(
      `ALTER TABLE ml_product DROP COLUMN is_synchronized;`,
    );

    await queryRunner.query(`ALTER TABLE sale_order DROP COLUMN ml_order_id`);
  }
}
