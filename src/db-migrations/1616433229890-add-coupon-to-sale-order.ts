import { MigrationInterface, QueryRunner } from 'typeorm';

export class addCouponToSaleOrder1616433229890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE sale_order ADD COLUMN coupon_id integer;',
    );

    await queryRunner.query(
      'ALTER TABLE sale_order ADD CONSTRAINT fk_coupon_id FOREIGN KEY (coupon_id) REFERENCES coupon(id);',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE sale_order DROP COLUMN coupon');
    await queryRunner.query(
      'ALTER TABLE sale_order DROP CONSTRAINT fk_coupon_id',
    );
  }
}
