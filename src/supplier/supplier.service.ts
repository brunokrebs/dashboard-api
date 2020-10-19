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

  save(supplier: Supplier): Promise<Supplier> {
    this.supplierRepository;
    return this.supplierRepository.save(supplier);
  }

  findByCNPJs(cnpjs: string[]): Promise<Supplier[]> {
    return this.supplierRepository.find({
      where: {
        cnpj: In(cnpjs),
      },
    });
  }

  getByCNPJ(cnpj: string): Promise<Supplier> {
    return this.supplierRepository.findOne({
      where: {
        cnpj: cnpj,
      },
    });
  }
}
