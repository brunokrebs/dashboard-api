import { MigrationInterface, QueryRunner } from 'typeorm';

export class addMlImageCollumn1608127073128 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE image ADD COLUMN ml_image_id VARCHAR(30);`,
    );
    await queryRunner.query(
      `ALTER TABLE image ADD COLUMN ml_image_status boolean;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE image DROP COLUMN ml_image_id;`);
    await queryRunner.query(`ALTER TABLE image DROP COLUMN ml_image_status;`);
  }
}
