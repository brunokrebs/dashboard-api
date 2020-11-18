import { MigrationInterface, QueryRunner } from 'typeorm';

export class uppercaseSku1605611543991 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('UPDATE product SET sku = UPPER(TRIM(sku))');
    await queryRunner.query(
      'UPDATE product_variation SET sku = UPPER(TRIM(sku))',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
