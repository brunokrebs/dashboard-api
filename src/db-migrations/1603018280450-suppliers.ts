import { MigrationInterface, QueryRunner } from 'typeorm';

export class suppliers1603018280450 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create table supplier (
            id serial primary key,
            version integer,
            cnpj varchar(14) not null unique,
            name varchar(90) not null
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        drop table supplier;
    `);
  }
}
