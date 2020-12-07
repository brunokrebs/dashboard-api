import { MigrationInterface, QueryRunner } from 'typeorm';

export class addFlagInProducts1606845280376 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE product ADD COLUMN is_composition boolean;',
    );

    await queryRunner.query(`
      UPDATE product SET is_composition = true
      WHERE id IN (
        SELECT product_id from product_composition
      );
    `);

    await queryRunner.query(`
      UPDATE product SET is_composition = false WHERE is_composition IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE product DROP COLUMN is_composition');
  }
}
