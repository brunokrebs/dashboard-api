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

  beforeEach(async () => {
    authorizedRequest = await getCredentials();

    await cleanUpDatabase();
    await insertProductFixtures();
    await createPurchaseOrders();
  });

  function updateStatus(purchaseOrder: any, status: PurchaseOrderStatus) {
    return axios.put(
      'http://localhost:3005/v1/purchase-orders',
      {
        status,
        referenceCode: purchaseOrder.referenceCode,
      },
      authorizedRequest,
    );
  }

  async function getCurrentPosition(sku: string) {
    const [{ position }] = await executeQuery(`
        select current_position as position
        from product_variation
        where sku = '${sku}'
      `);
    return position;
  }

  it('should record movements when changing status to COMPLETED', async () => {
    const purchaseOrder = purchaseOrdersScenarios[0];

    // find the initial inventory position of the item
    const initialPosition = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );

    // change the purchase order status to completed
    const response = await updateStatus(
      purchaseOrder,
      PurchaseOrderStatus.COMPLETED,
    );

    // check if the movement was recorded
    const positionAfterUpdate1 = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );
    expect(positionAfterUpdate1).toBe(
      initialPosition + purchaseOrder.items[0].amount,
    );
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();

    await updateStatus(purchaseOrder, PurchaseOrderStatus.COMPLETED);

    // check if the movement was recorded
    const positionAfterupdate2 = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );
    expect(positionAfterupdate2).toBe(positionAfterUpdate1);
  });

  it('should remove movements after reopening order', async () => {
    const purchaseOrder = purchaseOrdersScenarios[0];

    // find the initial inventory position of the item
    const initialPosition = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );

    await updateStatus(purchaseOrder, PurchaseOrderStatus.COMPLETED);
    // change the purchase order status to in process
    await updateStatus(purchaseOrder, PurchaseOrderStatus.IN_PROCESS);

    const positionAfterReopening = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );
    expect(positionAfterReopening).toBe(initialPosition);
  });

  it('should remove movements after cancelling order', async () => {
    const purchaseOrder = purchaseOrdersScenarios[0];

    // find the initial inventory position of the item
    const initialPosition = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );

    await updateStatus(purchaseOrder, PurchaseOrderStatus.COMPLETED);
    // change the purchase order status to completed
    await updateStatus(purchaseOrder, PurchaseOrderStatus.CANCELLED);

    const positionAfterCancelling = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );
    expect(positionAfterCancelling).toBe(initialPosition);
  });

  // - De in process para cancel
  it('should not change current inventory when cancelling an in process order', async () => {
    const purchaseOrder = purchaseOrdersScenarios[0];

    // find the initial inventory position of the item
    const initialPosition = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );

    // change the purchase order status to cancelled
    await updateStatus(purchaseOrder, PurchaseOrderStatus.CANCELLED);

    const positionAfterCancelling = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );
    expect(positionAfterCancelling).toBe(initialPosition);
  });

  // - De cancel para approvel
  it('should create movements when changing from cancelled to completed', async () => {
    const purchaseOrder = purchaseOrdersScenarios[0];

    // find the initial inventory position of the item
    const initialPosition = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );

    await updateStatus(purchaseOrder, PurchaseOrderStatus.CANCELLED);
    // change the purchase order status to ccompleted
    await updateStatus(purchaseOrder, PurchaseOrderStatus.COMPLETED);

    // check if the movement was recorded
    const positionAfterApproving = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );
    expect(positionAfterApproving).toBe(
      initialPosition + purchaseOrder.items[0].amount,
    );
  });

  // - De cancel para in process
  it('should not change current position after changing a cancelled order to in process', async () => {
    const purchaseOrder = purchaseOrdersScenarios[0];

    // find the initial inventory position of the item
    const initialPosition = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );

    // change the purchase order status to in process
    await updateStatus(purchaseOrder, PurchaseOrderStatus.CANCELLED);

    await updateStatus(purchaseOrder, PurchaseOrderStatus.IN_PROCESS);

    const positionAfterUpdate = await getCurrentPosition(
      purchaseOrder.items[0].productVariation.sku,
    );
    expect(positionAfterUpdate).toBe(initialPosition);
  });
});
