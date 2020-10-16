import { MigrationInterface, QueryRunner } from 'typeorm';

export class productPricingAdjustments1602886433307
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table product add column selling_price_old decimal(15,2);`,
    );

    await queryRunner.query(
      `update product set selling_price_old = selling_price;`,
    );

    await queryRunner.query(
      `update product p set selling_price = (select max(selling_price) from product_variation pv where pv.product_id = p.id);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `update product set selling_price = selling_price_old;`,
    );

    await queryRunner.query(
      `alter table product drop column selling_price_old;`,
    );
  }
}
