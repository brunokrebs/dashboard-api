import { MigrationInterface, QueryRunner } from 'typeorm';

export class addStatusPurchaseOrder1606137322244 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE purchase_order ADD COLUMN status varchar(60)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE purchase_order DROP COLUMN status');
  }
}
