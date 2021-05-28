import { MigrationInterface, QueryRunner } from 'typeorm';

export class setProductsDimensions1622125454497 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`
        UPDATE product SET  height =2,width = 2,length = 2,weight = 0.003 WHERE product.category = 'BERLOQUES';
        UPDATE product SET  height = 2,width = 2,length = 2,weight = 0.005 WHERE product.category = 'ANEIS';
        UPDATE product SET  height = 3,width = 3,length = 3,weight = 0.010 WHERE product.category = 'PULSEIRAS';
        UPDATE product SET  height =2,width =2,length =2,weight = 0.003 WHERE product.category = 'COLARES';
        UPDATE product SET  weight = 0.400 WHERE product.category = 'ACESSORIOS';
        UPDATE product SET  height = 40,width = 30,length = 0.300,weight = 0.500 WHERE product.category = 'DECORACAO';
        UPDATE product SET  height = 6,width = 6,length = 6,weight = 0.020 WHERE product.category = 'CONJUNTOS';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`
    UPDATE product SET  height = 0,width = 0,length = 0,weight = 0 WHERE product.category = 'BERLOQUES';
    UPDATE product SET  height = 0,width = 0,length = 0,weight = 0 WHERE product.category = 'ANEIS';
    UPDATE product SET  height = 0,width = 0,length = 0,weight = 0 WHERE product.category = 'PULSEIRAS';
    UPDATE product SET  height = 0,width = 0,length = 0,weight = 0 WHERE product.category = 'COLARES';
    UPDATE product SET  weight = 0 WHERE product.category = 'ACESSORIOS';
    UPDATE product SET  length = 0,weight = 0 WHERE product.category = 'DECORACAO';
    `);
  }
}
