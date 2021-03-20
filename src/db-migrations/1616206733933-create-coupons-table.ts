import { MigrationInterface, QueryRunner } from 'typeorm';

export class createCouponsTable1616206733933 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE coupon (
            id serial primary key,
            version integer,
            code varchar(20) not null,
            type varchar(10) not null,
            description varchar(120),
            value decimal(15,2),
            active boolean,
            creation_date timestamp
        )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE coupon`);
  }
}
