import { executeQueries, executeQuery } from '../utils/queries';
import purchaseOrderScenarios from './purchase-orders.scenarios.json';

export async function createPurchaseOrders() {
  const insertSuppliersJobs = purchaseOrderScenarios.map(async order => {
    // persist supplier and take note of its id
    const insertSupplierResult = await executeQuery(`
      insert into supplier (cnpj, name)
      values ('${order.supplier.cnpj}', '${order.supplier.name}')
      returning id;
    `);
    order.supplier.id = insertSupplierResult[0].id;

    // persist the order and take note of the id
    const {
      supplier,
      referenceCode,
      creationDate,
      completionDate,
      discount,
      shippingPrice,
      total,
      status,
    } = order;
    const insertOrderResult = await executeQuery(`
      insert into purchase_order (supplier_id, reference_code, creation_date, completion_date, discount, shipping_price, total, status)
      values (${supplier.id}, '${referenceCode}', '${creationDate}', '${completionDate}', ${discount}, ${shippingPrice}, ${total}, '${status}')
      returning id;
    `);

    order.id = insertOrderResult[0].id;

    // update order's items with product variation id
    const pvSkus = order.items
      .map(item => `'${item.productVariation.sku}'`)
      .join(', ');
    const pvIds = await executeQuery(
      `select id, sku from product_variation where sku in (${pvSkus})`,
    );
    order.items.forEach(item => {
      const pv = pvIds.find(pv => pv.sku === item.productVariation.sku);
      item.productVariation.id = pv.id;
    });

    // persist the order items
    const insertCommand =
      'insert into purchase_order_item (product_variation_id, purchase_order_id, price, amount, ipi) values ';

    const values = order.items
      .map(
        item => `(
          ${item.productVariation.id},
          ${order.id},
          ${item.price},
          ${item.amount},
          0
        )`,
      )
      .join(', ');

    await executeQueries(insertCommand + values);
  });
  await Promise.all(insertSuppliersJobs);
}
