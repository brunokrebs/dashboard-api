import { MigrationInterface, QueryRunner } from 'typeorm';

export class fixingOrders1603447855067 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `update sale_order set approval_date = (creation_date + interval '24 hours') where approval_date is null and payment_status = 'APPROVED';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // no op
  }
}
