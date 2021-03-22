import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { parseBoolean } from '../util/parsers';
import { CoupontDTO } from './coupon.dto';
import { Coupon } from './coupon.entity';
import { CouponService } from './coupon.service';

@Controller('coupon')
@UseGuards(JwtAuthGuard)
export class CouponController {
  constructor(private couponService: CouponService) {}
  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortedBy') sortedBy: string,
    @Query('sortDirectionAscending') sortDirectionAscending: string,
    @Query('query') query: string,
  ): Promise<Pagination<Coupon>> {
    return this.couponService.paginate({
      page,
      limit,
      sortedBy,
      sortDirectionAscending: parseBoolean(sortDirectionAscending),
      queryParams: [
        {
          key: 'query',
          value: query,
        },
      ],
    });
  }

  @Post('/save')
  async save(@Body() coupon: CoupontDTO): Promise<Coupon> {
    return this.couponService.save(coupon);
  }

  @Get('/is-code-available')
  async isCodeAvaliable(@Query('code') code: string) {
    return this.isCodeAvaliable(code);
  }
}
