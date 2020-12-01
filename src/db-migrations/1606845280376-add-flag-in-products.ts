import { MigrationInterface, QueryRunner } from 'typeorm';

export class addFlagInProducts1606845280376 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE product ADD COLUMN isComposition boolean;',
    );
    await queryRunner.query(`
      UPDATE product SET iscomposition = true
        FROM(SELECT product.id FROM product
             WHERE product.id IN (SELECT product_id from product_composition))as subquery
        WHERE  product.id = subquery.id
    `);
    await queryRunner.query(`
      UPDATE product SET iscomposition = false
        FROM(SELECT product.id FROM product
             WHERE product.id NOT IN (SELECT product_id from product_composition))as subquery
        WHERE  product.id = subquery.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE purchase_order DROP COLUMN iscomposition',
    );
  }
}
