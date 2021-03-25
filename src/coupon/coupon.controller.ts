import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { parseBoolean } from '../util/parsers';
import { CouponDTO } from './coupon.dto';
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
    @Query('status') status: string,
    @Query('type') type: string,
  ): Promise<Pagination<Coupon>> {
    const isActive = parseBoolean(status);
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
        {
          key: 'status',
          value: isActive,
        },
        {
          key: 'type',
          value: type,
        },
      ],
    });
  }

  @Get('/is-code-available')
  async isCodeAvaliable(@Query('code') code: string) {
    return this.couponService.isCodeAvailable(code);
  }

  @Get('/valid-coupons')
  async getValidCoupons() {
    return this.couponService.getValidCoupons();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Coupon> {
    return this.couponService.findCouponById(id);
  }

  @Post('/create')
  async createCoupon(@Body() coupon: CouponDTO): Promise<Coupon> {
    return this.couponService.createCoupon(coupon);
  }

  @Put()
  async updateCoupon(@Body() coupon: CouponDTO) {
    return this.couponService.updateCoupon(coupon);
  }
}
