import { MigrationInterface, QueryRunner } from 'typeorm';

export class pricingAdjustments1602805620541 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table product_variation add column selling_price_old decimal(15,2);`,
    );

    await queryRunner.query(
      `update product_variation set selling_price_old = selling_price;`,
    );

    const productVariations = await queryRunner.query(
      `select id, selling_price from product_variation`,
    );

    const updates = productVariations.map(async pv => {
      const pvId = pv.id;
      const sellingPrice = parseFloat(pv.selling_price);

      if (sellingPrice < 5) return;

      let newSellingPrice = sellingPrice * 1.1;
      newSellingPrice = Math.round(newSellingPrice / 5) * 5;
      newSellingPrice = newSellingPrice - 0.1;

      console.log(
        `Updating id ${pvId} from ${sellingPrice} to ${newSellingPrice}`,
      );

      await queryRunner.query(
        `update product_variation set selling_price = ${newSellingPrice} where id = ${pvId};`,
      );
    });

    await Promise.all(updates);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `update product_variation set selling_price = selling_price_old;`,
    );

    await queryRunner.query(
      `alter table product_variation drop column selling_price_old;`,
    );
  }
}
