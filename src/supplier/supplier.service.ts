import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pagination, paginate } from 'nestjs-typeorm-paginate';
import { IPaginationOpts } from 'src/pagination/pagination';
import { Brackets, In, Repository } from 'typeorm';
import { Supplier } from './supplier.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async paginate(options: IPaginationOpts): Promise<Pagination<Supplier>> {
    let sortDirection;
    let sortNulls;
    let orderColumn = '';

    switch (options.sortedBy?.trim()) {
      case undefined:
      case null:
      case '':
        orderColumn = 'name';
        break;
      case 'name':
        orderColumn = 'name';
        break;
      case 'cnpj':
        orderColumn = 'cnpj';
        break;
      default:
        orderColumn = options.sortedBy;
    }
    switch (options.sortDirectionAscending) {
      case undefined:
      case null:
      case true:
        sortDirection = 'ASC';
        sortNulls = 'NULLS FIRST';
        break;
      default:
        sortDirection = 'DESC';
        sortNulls = 'NULLS LAST';
    }

    const queryBuilder = this.supplierRepository
      .createQueryBuilder('s')
      .orderBy(orderColumn, sortDirection, sortNulls);

    options.queryParams
      .filter(queryParam => {
        return (
          queryParam !== null &&
          queryParam.value !== null &&
          queryParam.value !== undefined
        );
      })
      .forEach(queryParam => {
        switch (queryParam.key) {
          case 'query':
            queryBuilder.andWhere(
              new Brackets(qb => {
                qb.where(`lower(s.name) like lower(:query)`, {
                  query: `%${queryParam.value.toString()}%`,
                }).orWhere(`lower(s.cnpj) like lower(:query)`, {
                  query: `%${queryParam.value.toString()}%`,
                });
              }),
            );
            break;
        }
      });

    return paginate<Supplier>(queryBuilder, options);
  }

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
