import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { IPaginationOpts } from 'src/pagination/pagination';
import { Brackets, Repository } from 'typeorm';
import { CoupontDTO } from './coupon.dto';
import { Coupon } from './coupon.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
  ) {}

  async paginate(options: IPaginationOpts): Promise<Pagination<Coupon>> {
    const queryBuilder = this.couponRepository.createQueryBuilder('c');

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
                qb.where(`lower(c.code) like lower(:query)`, {
                  query: `%${queryParam.value.toString()}%`,
                }).orWhere(`lower(c.description) like lower(:query)`, {
                  query: `%${queryParam.value.toString()}%`,
                });
              }),
            );
            break;
        }
      });

    let sortDirection;
    let sortNulls;
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
    const orderColumn = 'code';
    queryBuilder.orderBy(orderColumn, sortDirection, sortNulls);
    return paginate<Coupon>(queryBuilder, options);
  }

  async save(coupon: CoupontDTO): Promise<Coupon> {
    coupon.code = coupon.code.toUpperCase().trim();
    console.log(coupon);
    //await this.couponRepository.save(coupon);
    return;
  }

  async isCodeAvailable(code: string) {
    code = code.toUpperCase().trim();
    const existingCode = await this.couponRepository
      .createQueryBuilder('c')
      .select('c.code')
      .where('c.code = :code', { code })
      .getOne();
    return !!existingCode;
  }
}
