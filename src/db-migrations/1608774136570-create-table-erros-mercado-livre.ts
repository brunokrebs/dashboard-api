import { MigrationInterface, QueryRunner } from 'typeorm';

export class createTableErrosMercadoLivre1608774136570
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE ml_error (
                id serial not null primary key,
                product_id integer,
                error varchar(150),
                version integer, 
                CONSTRAINT fk_product_id FOREIGN KEY (product_id) REFERENCES product(id)
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ml_error`);
  }
}
