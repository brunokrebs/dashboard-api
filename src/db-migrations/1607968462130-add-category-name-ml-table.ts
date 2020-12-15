import { MigrationInterface, QueryRunner } from 'typeorm';

export class addCategoryNameMlTable1607968462130 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ml_product ADD COLUMN category_name varchar(30);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ml_product DROP COLUMN category_name;`,
    );
  }
}
