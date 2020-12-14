import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterTableProducts1607711983977 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE product ADD COLUMN ml_product integer;`,
    );
    await queryRunner.query(`
      UPDATE product SET ml_product = subquery.id FROM (
        SELECT ml.id,ml.product_id 
          FROM ml_product as ml 
      ) AS subquery WHERE product.id = subquery.product_id;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE product DROP COLUMN ml_product;');
  }
}
