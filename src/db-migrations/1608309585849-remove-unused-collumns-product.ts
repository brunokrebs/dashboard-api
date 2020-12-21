import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeUnusedCollumnsProduct1608309585849
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE product DROP COLUMN mercado_livre_id;`,
    );
    await queryRunner.query(
      `ALTER TABLE product DROP COLUMN mercado_livre_category_id;`,
    );

    await queryRunner.query(
      `ALTER TABLE ml_product DROP COLUMN creation_date;`,
    );
    await queryRunner.query(
      `ALTER TABLE ml_product DROP COLUMN completion_date;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
