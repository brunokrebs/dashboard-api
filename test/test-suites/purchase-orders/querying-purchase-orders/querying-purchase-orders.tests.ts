import axios from 'axios';
import { getCredentials } from '../../utils/credentials';
import { cleanUpDatabase } from '../../../test-suites/utils/queries';

import { createPurchaseOrders } from '../purchase-orders.fixtures';
import purchaseOrdersScenarios from '../purchase-orders.scenarios.json';
import { insertProductFixtures } from '../../products/products-fixtures/products.fixture';

describe('querying purchase orders', () => {
  let authorizedRequest: any;

  beforeAll(async () => {
    authorizedRequest = await getCredentials();

    await cleanUpDatabase();

    await insertProductFixtures();
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
  });
});
