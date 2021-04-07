import { MigrationInterface, QueryRunner } from 'typeorm';

export class fixCategoiresDiaDasMaes1617798274876
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `update product set category = 'MAE_DESCOLADA' where category = 'MAE_ESTILOSA';`,
    );
    await queryRunner.query(
      `update product set category = 'MAE_LOUCA_POR_FRIDA' where category = 'MAE_ARTISTA';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `update product set category = 'MAE_ESTILOSA' where category = 'MAE_DESCOLADA';`,
    );
    await queryRunner.query(
      `update product set category = 'MAE_ARTISTA' where category = 'MAE_LOUCA_POR_FRIDA';`,
    );
  }
}
