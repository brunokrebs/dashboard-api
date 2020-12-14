import { MigrationInterface, QueryRunner } from 'typeorm';

export class createTableMlProducts1607628339356 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE ml_product (
                id serial primary key,
                version integer,
                product_id int not null,
                category_id varchar(30),
                mercado_livre_id varchar(30),
                creation_date timestamp,
                completion_date timestamp,
                need_atualization boolean,
                constraint ml_product foreign key (product_id) references product(id)
            );
        `);

    await queryRunner.query(
      `ALTER TABLE product ADD COLUMN is_ml_product boolean;`,
    );

    await queryRunner.query(
      `UPDATE product SET is_ml_product = true WHERE mercado_livre_id is not null`,
    );

    await queryRunner.query(`
        INSERT INTO ml_product (product_id, mercado_livre_id,category_id)
	        SELECT id, mercado_livre_id, mercado_livre_category_id FROM product
        WHERE  mercado_livre_id is not null;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE product DROP COLUMN is_ml_product;`);

    await queryRunner.query('DROP TABLE ml_product;');
  }
}