import { MigrationInterface, QueryRunner } from 'typeorm';

export class uppercaseSku1605611543991 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('UPDATE product set sku = UPPER(sku)');
    await queryRunner.query('UPDATE product set sku = Trim(sku)');
    await queryRunner.query('UPDATE product_variation set sku = UPPER(sku)');
    await queryRunner.query('UPDATE product_variation set sku = Trim(sku)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
