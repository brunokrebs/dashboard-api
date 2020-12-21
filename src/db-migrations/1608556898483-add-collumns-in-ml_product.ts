import { MigrationInterface, QueryRunner } from 'typeorm';

export class addCollumnsInMlProduct1608556898483 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ml_product ADD COLUMN ad_type varchar(15);`,
    );
    await queryRunner.query(
      `ALTER TABLE ml_product ADD COLUMN warranty_type varchar(30);`,
    );
    await queryRunner.query(
      `ALTER TABLE ml_product ADD COLUMN warranty_time_id varchar(5);`,
    );
    await queryRunner.query(
      `ALTER TABLE ml_product ADD COLUMN warranty_time integer;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ml_product DROP COLUMN ad_type;`);
    await queryRunner.query(
      `ALTER TABLE ml_product DROP COLUMN warranty_type;`,
    );
    await queryRunner.query(
      `ALTER TABLE ml_product DROP COLUMN warranty_time_id;`,
    );
    await queryRunner.query(
      `ALTER TABLE ml_product DROP COLUMN warranty_time;`,
    );
  }
}
