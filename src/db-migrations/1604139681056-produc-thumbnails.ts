import { MigrationInterface, QueryRunner } from 'typeorm';

export class producThumbnails1604139681056 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `update product_image set image_order = image_order + 1 where product_id in (116, 170);`,
    );
    await queryRunner.query(
      `alter table product add column thumbnail character varying(400);`,
    );
    await queryRunner.query(`
        update product p set thumbnail = (
            select thumbnail_file_url from image i
            right join product_image pi on pi.image_id = i.id
            where pi.product_id = p.id
            and pi.image_order = 1
        )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table product drop column thumbnail;`);
  }
}
