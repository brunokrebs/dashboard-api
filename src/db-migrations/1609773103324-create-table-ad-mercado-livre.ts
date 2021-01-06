import { MigrationInterface, QueryRunner } from 'typeorm';

export class createTableAdMercadoLivre1609773103324
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(` 
        CREATE TABLE ml_ad (
            id serial primary key,
            version integer,
            product_id int not null,
            category_id varchar(30),
            category_name varchar(30),
            mercado_livre_id varchar(30),
            ad_type varchar(15),
            is_active boolean,
            is_synchronized boolean,
            ad_disabled boolean,
            need_atualization boolean,
            CONSTRAINT ml_ad FOREIGN KEY (product_id) REFERENCES product(id)
        );
        `);

    await queryRunner.query(
      `ALTER TABLE product ADD COLUMN ml_product integer;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ml_ad;`);
    await queryRunner.query(`ALTER TABLE product DROP COLUMN ml_product;`);
  }
}
