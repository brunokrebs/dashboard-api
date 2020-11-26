import axios from 'axios';
import { getCredentials } from '../../utils/credentials';
import {
  cleanUpDatabase,
  executeQuery,
} from '../../../test-suites/utils/queries';

import { createPurchaseOrders } from '../purchase-orders.fixtures';
import purchaseOrdersScenarios from '../purchase-orders.scenarios.json';
import { insertProductFixtures } from '../../products/products-fixtures/products.fixture';
import { PurchaseOrderStatus } from '../../../../src/purchase-order/purchase-order.enum';

describe('updating purchasing order status', () => {
  let authorizedRequest: any;

  beforeAll(async () => {
    authorizedRequest = await getCredentials();

    await cleanUpDatabase();

    await insertProductFixtures();
    await createPurchaseOrders();
  });

  it('should update movements properly', async () => {
    const purchaseOrder = purchaseOrdersScenarios[0];

    // find the initial inventory position of the item
    const [{ initialposition }] = await executeQuery(`
      select current_position as initialposition
      from product_variation
      where sku = '${purchaseOrder.items[0].productVariation.sku}'
    `);

    // change the purchase order status to completed
    purchaseOrder.status = PurchaseOrderStatus.COMPLETED;
    const response = await axios.put(
      'http://localhost:3005/v1/purchase-orders',
      purchaseOrder,
      authorizedRequest,
    );

    // check if the movement was recorded
    const [{ positionAfterUpdate1 }] = await executeQuery(`
      select current_position as positionAfterUpdate1
      from product_variation
      where sku = '${purchaseOrder.items[0].productVariation.sku}'
    `);
    expect(positionAfterUpdate1).toBe(
      initialposition + purchaseOrder.items[0].amount,
    );
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();

    const response2 = await axios.put(
      'http://localhost:3005/v1/purchase-orders',
      purchaseOrder,
      authorizedRequest,
    );

    // check if the movement was recorded
    const [{ positionAfterUpdate2 }] = await executeQuery(`
      select current_position as positionAfterUpdate2
      from product_variation
      where sku = '${purchaseOrder.items[0].productVariation.sku}'
    `);
    expect(positionAfterUpdate2).toBe(
      initialposition + purchaseOrder.items[0].amount,
    );
    expect(response2).toBeDefined();
    expect(response2.data).toBeDefined();
  });
});
