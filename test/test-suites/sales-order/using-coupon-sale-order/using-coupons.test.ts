import axios from 'axios';
import { getCredentials } from '../../utils/credentials';
import { cleanUpDatabase, executeQuery } from '../../utils/queries';

import couponScenarios from './coupons.scenarios.json';
import saleOrderCouponsScenarios from './sale-order-coupons.scenario.json';
import { SaleOrder } from 'src/sales-order/entities/sale-order.entity';
import { insertProductFixtures } from '../../products/products-fixtures/products.fixture';

async function insertCouponsFixtures() {
  const couponsJob = couponScenarios.map(coupon => {
    return executeQuery(
      `INSERT INTO coupon (code,type,value,active)
       VALUES ('${coupon.code}','${coupon.type}',${coupon.value},true);`,
    );
  });
  await Promise.all(couponsJob);
}

describe('sale order with coupons use', () => {
  let authorizedRequest: any;

  beforeAll(async () => {
    authorizedRequest = await getCredentials();

    await cleanUpDatabase();
    await insertProductFixtures();
    await insertCouponsFixtures();
  });

  saleOrderCouponsScenarios.forEach((saleOrder: any, idx: number) => {
    it(`should persist sale orders with coupon(scenario #${idx})`, async () => {
      const response = await axios.post(
        'http://localhost:3005/v1/sales-order',
        saleOrder,
        authorizedRequest,
      );
      expect(response).toBeDefined();
      expect(response.status).toBe(201);
      const saleOrderCreated: SaleOrder = response.data;

      switch (saleOrderCreated.coupon.type) {
        case 'R$':
          expect(saleOrderCreated.paymentDetails.total).toBe(99.9);
          break;
        case 'PERCENTAGE':
          expect(saleOrderCreated.paymentDetails.total).toBe(100.9);
          break;
        case 'EQUIPE':
          expect(saleOrderCreated.shipmentDetails.shippingPrice).toBe(0);
          expect(saleOrderCreated.paymentDetails.total).toBe(66);
          break;
        case 'SHIPPING':
          expect(saleOrderCreated.shipmentDetails.shippingPrice).toBe(0);
          break;
      }
    });
  });
});
