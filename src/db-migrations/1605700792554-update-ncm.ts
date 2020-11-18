import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateNcm1605700792554 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE product set ncm='9004' WHERE product.ncm='9004.'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE product set ncm='9004.' WHERE product.ncm='9004'",
    );
  }
}
