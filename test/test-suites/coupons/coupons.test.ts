import axios from 'axios';
import { Coupon } from 'src/coupon/coupon.entity';
import { getCredentials } from '../utils/credentials';
import { cleanUpDatabase, executeQuery } from '../utils/queries';

import couponScenarios from './coupons.scenarios.json';

describe('sale order with coupons use', () => {
  let authorizedRequest: any;

  beforeAll(async () => {
    authorizedRequest = await getCredentials();

    await cleanUpDatabase();
  });

  couponScenarios.forEach((coupon: Coupon, idx: number) => {
    it('should be able to create a coupon', async () => {
      const response = await axios.post(
        'http://localhost:3005/v1/coupon/create',
        coupon,
        authorizedRequest,
      );

      const createdCoupon = response.data;
      expect(createdCoupon.code).toBe(coupon.code);
      expect(createdCoupon.type).toBe(coupon.type);
      expect(createdCoupon.description).toBe(coupon.description);
      expect(createdCoupon.value).toBe(coupon.value);
      expect(createdCoupon.active).toBe(coupon.active);
    });
  });

  it('must not register coupon with the same code', async () => {
    const coupon = couponScenarios[0];
    let response = await axios.post(
      'http://localhost:3005/v1/coupon/create',
      coupon,
      authorizedRequest,
    );

    const createdCoupon = response.data;
    expect(createdCoupon.code).toBe(coupon.code);
    try {
      response = await axios.post(
        'http://localhost:3005/v1/coupon/create',
        coupon,
        authorizedRequest,
      );

      fail('should have generated a coupon error with repeated code');
    } catch (error) {}
  });

  it('must not register coupon with expirated date', async () => {
    const coupon: Coupon = couponScenarios[0];
    coupon.expirationDate = new Date('2020-01-21');

    try {
      const response = await axios.post(
        'http://localhost:3005/v1/coupon/create',
        coupon,
        authorizedRequest,
      );

      fail('should have generated a coupon error with old expiration date');
    } catch (error) {}
  });

  it('shold be able to update coupon', async () => {
    const coupon = couponScenarios[0];
    await executeQuery(
      `INSERT INTO coupon (code,type,value,active)
         VALUES ('${coupon.code}','${coupon.type}',${coupon.value},true);`,
    );

    coupon.type = 'EQUIPE';
    await axios.put(
      'http://localhost:3005/v1/coupon',
      coupon,
      authorizedRequest,
    );

    const [updatedCoupon] = await executeQuery(
      `SELECT * FROM coupon WHERE code ='${coupon.code}'`,
    );
    expect(updatedCoupon.type).toBe('EQUIPE');
  });
});
