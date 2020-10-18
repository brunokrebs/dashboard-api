import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  save(supplier: Supplier): Promise<Supplier> {
    return this.supplierRepository.save(supplier);
  }

  getByCNPJ(cnpj: string): Promise<Supplier> {
    return this.supplierRepository.findOne({
      where: {
        cnpj: cnpj,
      },
    });
  }
}
