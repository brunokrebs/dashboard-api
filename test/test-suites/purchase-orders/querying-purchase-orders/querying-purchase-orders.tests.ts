import axios from 'axios';
import { getCredentials } from '../../utils/credentials';
import {
  cleanUpDatabase,
  executeQuery,
} from '../../../test-suites/utils/queries';

import { createPurchaseOrders } from '../purchase-orders.fixtures';
import purchaseOrdersScenarios from '../purchase-orders.scenarios.json';
import {
  insertProductFixtures,
  insertProductWithComposition,
} from '../../products/products-fixtures/products.fixture';

describe('querying purchase orders', () => {
  let authorizedRequest: any;

  beforeAll(async () => {
    authorizedRequest = await getCredentials();

    await cleanUpDatabase();

    await insertProductFixtures();
    await insertProductWithComposition();
    await createPurchaseOrders();
  });

  it('should be able to query purchase orders', async () => {
    const response = await axios.get(
      'http://localhost:3005/v1/purchase-orders?page=1&limit=3',
      authorizedRequest,
    );

    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.status).toBe(200);

    // TODO check the returned data
  });

  it('should calculate total of purchase order', async () => {
    const results = await executeQuery(`
        select reference_code, total
        from purchase_order
    `);
    results.forEach(({ reference_code, total: persistedTotal }) => {
      const { total: expectedTotal } = purchaseOrdersScenarios.find(
        s => s.referenceCode === reference_code,
      );
      expect(Number.parseFloat(persistedTotal)).toBe(expectedTotal);
    });
  });

  it('should not insert a purchase order with a product composition or transaction fail', async () => {
    const [{ id }] = await executeQuery(`select id from supplier;`);
    const purchaseOrder = {
      id: null,
      referenceCode: 'ref000',
      supplier: { id },
      items: [
        {
          productVariation: {
            id: 45630,
            sku: 'CP-1',
          },
          price: 15.35,
          amount: 12,
        },
      ],
      discount: 0,
      shippingPrice: 0,
      status: 'IN_PROCESS',
    };

    try {
      await axios.post(
        'http://localhost:3005/v1/purchase-orders',
        purchaseOrder,
        authorizedRequest,
      );
      fail('error expected');
    } catch (err) {
      //good a error is expected
      const order = await executeQuery('SELECT * from purchase_order;');
      expect(order.length).toBe(4);
    }
  });
});
