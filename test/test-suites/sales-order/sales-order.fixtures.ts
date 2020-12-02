import saleOrderScenarios from './sales-order.scenarios.json';
import axios from 'axios';
import { getCredentials } from '../utils/credentials';

export async function createSaleOrders() {
  const authorizedRequest = await getCredentials();
  const insertJobs = saleOrderScenarios.map(async order => {
    await axios.post(
      'http://localhost:3005/v1/sales-order',
      order,
      authorizedRequest,
    );
  });
  await Promise.all(insertJobs);
}
