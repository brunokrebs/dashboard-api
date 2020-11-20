import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateThumbnail1605522052314 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        update product p set thumbnail = (
            select thumbnail_file_url from image i
            right join product_image pi on pi.image_id = i.id
            where pi.product_id = p.id
            and pi.image_order = 1
        )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // no op
  }
}
