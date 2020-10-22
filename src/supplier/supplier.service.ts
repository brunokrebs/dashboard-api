import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Supplier } from './supplier.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  findByCNPJ(cnpj: string): Promise<Supplier> {
    return this.supplierRepository.findOne({
      where: {
        cnpj: cnpj,
      },
    });
  }

  findByCNPJs(cnpjs: string[]): Promise<Supplier[]> {
    return this.supplierRepository.find({
      where: {
        cnpj: In(cnpjs),
      },
    });
  }

  findById(id: number): Promise<Supplier> {
    return this.supplierRepository.findOne(id);
  }

  async findOrCreate(supplier: Supplier): Promise<Supplier> {
    const existingSupplier = await this.findByCNPJ(
      supplier.cnpj.replace(/\D/g, ''),
    );
    if (existingSupplier) return Promise.resolve(existingSupplier);
    return this.save(supplier);
  }

  save(supplier: Supplier): Promise<Supplier> {
    supplier.cnpj = supplier.cnpj?.replace(/\D/g, '');
    return this.supplierRepository.save(supplier);
  }

  update(id: number, supplier: Supplier): Promise<Supplier> {
    supplier.id = id;
    return this.save(supplier);
  }
}
