import { MigrationInterface, QueryRunner } from 'typeorm';
import bcrypt from 'bcryptjs';

export class cryptPasword1606950847633 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.query('SELECT * FROM app_user;');
    const updateJob = users.map(async user => {
      user.password = await bcrypt.hash(user.password, 10);
      return queryRunner.query(
        `UPDATE app_user SET password = '${user.password}' WHERE id = ${user.id}`,
      );
    });
    await Promise.all(updateJob);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
