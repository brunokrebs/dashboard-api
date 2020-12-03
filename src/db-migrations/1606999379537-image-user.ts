import { MigrationInterface, QueryRunner } from 'typeorm';

export class imageUser1606999379537 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE app_user ADD COLUMN image varchar(150);',
    );
    await queryRunner.query(`
            UPDATE app_user
            SET image = 'https://ca.slack-edge.com/TME6WME80-UM2PBBMPC-8e9740e2b805-512'
            WHERE id = 1;
        `);
    await queryRunner.query(`
            UPDATE app_user
            SET image = 'https://ca.slack-edge.com/TME6WME80-UMG2WGPE3-a81c734204fc-512'
            WHERE id = 2;
        `);
    await queryRunner.query(`
            UPDATE app_user
            SET image = 'https://ca.slack-edge.com/TME6WME80-UM7RB43LH-b30d268f66af-512'
            WHERE id = 3;
        `);
    await queryRunner.query(`
            UPDATE app_user
            SET image = 'https://ca.slack-edge.com/TME6WME80-U011GGX3QRK-d13e71a0b762-512'
            WHERE id = 4;
        `);
    await queryRunner.query(`
            UPDATE app_user
            SET image = 'https://avatars.slack-edge.com/2020-03-26/1028864095909_97a24f21793bea99d852_72.jpg'
            WHERE id = 5;
        `);
    await queryRunner.query(`
            UPDATE app_user
            SET image = 'https://ca.slack-edge.com/TME6WME80-U01CHPHTUJW-473e6846df09-512'
            WHERE id = 6;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app_user DROP COLUMN image;');
  }
}
