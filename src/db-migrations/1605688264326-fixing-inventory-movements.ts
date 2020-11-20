import { MigrationInterface, QueryRunner } from 'typeorm';

export class fixingInventoryMovements1605688264326
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'alter table inventory_movement alter column created set default now();',
    );

    await queryRunner.query(`
        update inventory_movement im
            set created = (
                select creation_date from sale_order so where so.id = im.sale_order_id
            )
        where im.sale_order_id is not null;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'alter table inventory_movement alter column created set default null;',
    );
  }
}
