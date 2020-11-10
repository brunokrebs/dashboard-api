import { MigrationInterface, QueryRunner } from 'typeorm';

export class addColumnTotalAsPurchaseOrder1604928242359
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'alter table purchase_order add column total numeric(15,2);',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'alter table purchase_order drop column total numeric(15,2);',
    );
  }
}
