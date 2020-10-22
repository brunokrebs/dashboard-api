import axios from 'axios';
import { getCredentials } from '../utils/credentials';
import { cleanUpDatabase } from '../../test-suites/utils/queries';

describe('inserting suppliers', () => {
  let authorizedRequest: any;

  beforeAll(async () => {
    authorizedRequest = await getCredentials();

    await cleanUpDatabase();
  });

  it('should be able to insert supplier', async () => {
    const supplier = {
      cnpj: '30.926.829/0001-80',
      name: 'LB Comércio de Joias LTDA',
    };

    const response = await axios.post(
      'http://localhost:3005/v1/suppliers/',
      supplier,
      authorizedRequest,
    );

    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.status).toBe(201);

    const supplierCreated = response.data;
    expect(supplierCreated.id).toBeDefined();
    expect(supplierCreated.name).toBe(supplier.name);
    expect(supplierCreated.cnpj).toBe(supplier.cnpj.replace(/\D/g, ''));
  });
});
