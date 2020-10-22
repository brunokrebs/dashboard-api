import { MigrationInterface, QueryRunner } from 'typeorm';

export class purchaseOrders1603046272868 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create table purchase_order (
            id serial primary key,
            version integer,
            supplier_id int not null,
            reference_code varchar(36) not null,
            creation_date timestamp,
            completion_date timestamp,
            discount decimal(15,2),
            shipping_price decimal(15,2),
            constraint purchase_order_supplier foreign key (supplier_id) references supplier(id)
        );
    `);
    await queryRunner.query(`
        create table purchase_order_item (
          id serial primary key,
          version integer,
          product_variation_id integer not null,
          purchase_order_id integer not null,
          price decimal(15,2) not null,
          amount decimal(15,2),
          ipi decimal(7,6),
          constraint purchase_order_item_product_variation foreign key (product_variation_id) references product_variation(id),
          constraint purchase_order_item_purchase_order foreign key (purchase_order_id) references purchase_order(id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      truncate table purchase_order_item;
    `);
    await queryRunner.query(`
      drop table purchase_order_item;
    `);
    await queryRunner.query(`
      truncate table purchase_order;
    `);
    await queryRunner.query(`
      drop table purchase_order;
    `);
  }
}
