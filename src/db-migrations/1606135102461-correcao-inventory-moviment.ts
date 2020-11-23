import { MigrationInterface, QueryRunner } from 'typeorm';

export class correcaoInventoryMoviment1606135102461
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE inventory_movement ADD purchase_order_id integer',
    );
    await queryRunner.query(
      'ALTER TABLE inventory_movement ADD FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id)',
    );
    await queryRunner.query(
      "UPDATE inventory_movement SET sale_order_id = NULL,purchase_order_id = 1  WHERE inventory_movement.description like 'Movimentação gerada pela ordem de compra 21%'",
    );
    await queryRunner.query(
      "UPDATE inventory_movement SET sale_order_id = NULL,purchase_order_id = 2  WHERE inventory_movement.description like 'Movimentação gerada pela ordem de compra 22%'",
    );
    await queryRunner.query(
      "UPDATE inventory_movement SET sale_order_id = NULL,purchase_order_id = 4  WHERE inventory_movement.description like 'Movimentação gerada pela ordem de compra 23%'",
    );
    await queryRunner.query(
      "UPDATE inventory_movement SET sale_order_id = NULL,purchase_order_id = 5  WHERE inventory_movement.description like 'Movimentação gerada pela ordem de compra 24%'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE inventory_movement SET sale_order_id= 5,purchase_order_id = NULL  WHERE inventory_movement.description like 'Movimentação gerada pela ordem de compra 24%'",
    );
    await queryRunner.query(
      "UPDATE inventory_movement SET sale_order_id= 4,purchase_order_id = NULL  WHERE inventory_movement.description like 'Movimentação gerada pela ordem de compra 23%'",
    );
    await queryRunner.query(
      "UPDATE inventory_movement SET sale_order_id= 2,purchase_order_id = NULL  WHERE inventory_movement.description like 'Movimentação gerada pela ordem de compra 22%'",
    );
    await queryRunner.query(
      "UPDATE inventory_movement SET sale_order_id= 1,purchase_order_id = NULL  WHERE inventory_movement.description like 'Movimentação gerada pela ordem de compra 21%'",
    );
    await queryRunner.query(
      'ALTER TABLE inventory_movement DROP CONSTRAINT inventory_movement_purchase_order_id_fkey',
    );
    await queryRunner.query(
      'ALTER TABLE inventory_movement DROP CONSTRAINT inventory_movement_purchase_order_id_fkey',
    );
    await queryRunner.query(
      'ALTER TABLE inventory_movement DROP COLUMN purchase_order_id',
    );
  }
}
