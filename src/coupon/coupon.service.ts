import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { IPaginationOpts } from 'src/pagination/pagination';
import { Brackets, Repository } from 'typeorm';
import { CouponDTO } from './coupon.dto';
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

  async save(couponDTO: CouponDTO): Promise<Coupon> {
    couponDTO.code = couponDTO.code.toUpperCase().trim();
    const existingCoupon = await this.couponRepository.findOne({
      code: couponDTO.code,
    });
    if (existingCoupon) return existingCoupon;
    const today = new Date();
    // see a better solution
    if (
      moment(couponDTO.expirationDate).isBefore(
        new Date(
          Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
        ),
      )
    ) {
      throw new Error(
        "A coupon's expiration date cannot be less than the current date",
      );
    }

    const coupon: Coupon = {
      id: couponDTO.id,
      code: couponDTO.code,
      description: couponDTO.description,
      type: couponDTO.type,
      value: couponDTO.value,
      expirationDate: couponDTO.expirationDate,
      active: couponDTO.active,
    };

    return await this.couponRepository.save(coupon);
  }

  async isCodeAvailable(code: string) {
    code = code.toUpperCase().trim();
    const existingCode = await this.couponRepository
      .createQueryBuilder('c')
      .select('c.code')
      .where('c.code = :code', { code })
      .getOne();
    console.log(existingCode);
    return !!existingCode;
  }

  async findCouponByCode(code: string) {
    return await this.couponRepository.findOne({ code, active: true });
  }

  async findCouponById(id: number) {
    return await this.couponRepository.findOne({ id });
  }

  calculateCouponDiscount(saleOrderDTO, items, coupon) {
    let itemsTotal: number;
    let total: number;
    switch (coupon.type) {
      case 'R$':
        itemsTotal = items.reduce((currentValue, item) => {
          return (item.price - item.discount) * item.amount + currentValue;
        }, 0);

        total =
          itemsTotal -
          (saleOrderDTO.discount || 0) +
          saleOrderDTO.shippingPrice -
          coupon.value;
        return { total, shippingPrice: saleOrderDTO.shippingPrice };
      case 'percentage':
        itemsTotal = this.calculatePercentageDiscount(items, coupon);
        total =
          itemsTotal -
          (saleOrderDTO.discount || 0) +
          saleOrderDTO.shippingPrice;
        return { total, shippingPrice: saleOrderDTO.shippingPrice };
      case 'EQUIPE':
        saleOrderDTO.shippingPrice = 0;
        itemsTotal = this.calculatePercentageDiscount(items, coupon);
        total =
          itemsTotal -
          (saleOrderDTO.discount || 0) +
          saleOrderDTO.shippingPrice;
        return { total, shippingPrice: saleOrderDTO.shippingPrice };
      case 'SHIPPING':
        itemsTotal = items.reduce((currentValue, item) => {
          return (item.price - item.discount) * item.amount + currentValue;
        }, 0);

        total = itemsTotal - (saleOrderDTO.discount || 0);
        return { total, shippingPrice: 0 };
      default:
        return;
    }
  }

  calculatePercentageDiscount(items, coupon) {
    return items.reduce((currentValue, item) => {
      return (
        (item.price - item.discount - item.price * (coupon.value / 100)) *
          item.amount +
        currentValue
      );
    }, 0);
  }

  @Cron('* * 23 * * *')
  async expirateCoupon() {
    await this.couponRepository
      .createQueryBuilder('c')
      .update(Coupon)
      .set({ active: false })
      .where('active = true')
      .andWhere('DATE(expiration_date) < :date', {
        date: new Date(),
      })
      .execute();
  }
}
