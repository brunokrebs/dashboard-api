import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeEmpityEmail1607445469974 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("UPDATE customer SET email= null WHERE email='';");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
