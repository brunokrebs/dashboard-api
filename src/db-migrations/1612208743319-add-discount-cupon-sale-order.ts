import { MigrationInterface, QueryRunner } from 'typeorm';

export class addDiscountCuponSaleOrder1612208743319
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE sale_order ADD COLUMN coupon_code VARCHAR(35)',
    );
    await queryRunner.query(
      'ALTER TABLE sale_order ADD COLUMN coupon_value INTEGER',
    );
    await queryRunner.query(
      'ALTER TABLE sale_order ADD COLUMN coupon_type VARCHAR(10)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE sale_order DROP COLUMN coupon_code');
    await queryRunner.query('ALTER TABLE sale_order DROP COLUMN coupon_value');
    await queryRunner.query('ALTER TABLE sale_order DROP COLUMN coupon_type');
  }
}
