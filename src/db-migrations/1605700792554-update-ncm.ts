import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateNcm1605700792554 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE product SET ncm = '' WHERE ncm = '9004.' OR TRIM(ncm) = '';",
    );
    await queryRunner.query(
      "UPDATE product SET ncm = CONCAT(SUBSTRING(ncm FROM 1 FOR 4), '.', SUBSTRING(ncm FROM 5 FOR 2), '.', SUBSTRING(ncm FROM 7 FOR 2)) WHERE LENGTH(ncm) > 0 AND LENGTH(ncm) < 10",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // no op
  }
}
