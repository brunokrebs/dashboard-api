import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterTableMlAdAddColumnId1610581406669
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ml_ad ADD COLUMN additional_price 	numeric(15,2);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ml_ad DROP COLUMN additional_price;`);
  }
}
