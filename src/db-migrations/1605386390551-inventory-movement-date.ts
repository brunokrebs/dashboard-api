import { MigrationInterface, QueryRunner } from 'typeorm';

export class inventoryMovementDate1605386390551 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table inventory_movement add column created timestamp with time zone;`,
    );

    await queryRunner.query(
      `update inventory_movement set created = '2020-09-14 08:00:00+03' where description = 'Informação originária do Bling.';`,
    );

    await queryRunner.query(
      `update inventory_movement set created = '2020-09-14 08:10:00+03' where description = 'Criação do produto composto.';`,
    );

    await queryRunner.query(
      `update inventory_movement set created = '2020-09-14 08:15:00+03' where description = 'Sincronização (migração) de pedidos em digitação.'`,
    );

    await this.updateMovementsMissingSalesOrderIds(queryRunner);

    await queryRunner.query(`
        update inventory_movement im
            set created = (
                select creation_date from sale_order so where so.id = im.sale_order_id
            )
        where im.sale_order_id is not null;`);

    await queryRunner.query(
      `update inventory_movement set created = '2020-11-06 08:15:00+03' where created is null;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table inventory_movement drop column created;`,
    );
  }

  private async updateMovementsMissingSalesOrderIds(queryRunner: QueryRunner) {
    const movements = await queryRunner.query(
      `select * from inventory_movement where description ilike 'Movimentação gerada pela ordem de compra%';`,
    );

    const updateMovementJobs = movements.map(async movement => {
      const saleId = movement.description
        .replace('Movimentação gerada pela ordem de compra', '')
        .replace('.', '')
        .trim();
      await queryRunner.query(
        `update inventory_movement set sale_order_id = ${saleId} where id = ${movement.id};`,
      );
    });
    await Promise.all(updateMovementJobs);
  }
}
