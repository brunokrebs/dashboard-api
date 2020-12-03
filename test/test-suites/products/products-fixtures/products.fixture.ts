import axios from 'axios';
import products from './products.fixtures.json';
import compositeScenarios from '../products-fixtures/product-with-composition-fixture.json';

import { getCredentials } from '../../utils/credentials';
import { executeQuery } from '../../utils/queries';

export async function insertProductFixtures() {
  const authorizedRequest = await getCredentials();

  const insertProductJobs = products.map((product, index) => {
    return new Promise(async res => {
      await axios.post(
        'http://localhost:3005/v1/products',
        product,
        authorizedRequest,
      );

      await executeQuery(`
        update product
        set images_size = ${product.images_size}, variations_size = ${product.variations_size}
        where sku = '${product.sku}';`);
      res();
    });
  });
  await Promise.all(insertProductJobs);
}

export async function insertProductWithComposition() {
  const authorizedRequest = await getCredentials();

  const parts = compositeScenarios.filter(p => !p.productComposition);
  const compositions = compositeScenarios.filter(p => !p.productComposition);

  // first we insert all parts
  const insertPartJobs = parts.map(product =>
    axios.post('http://localhost:3005/v1/products', product, authorizedRequest),
  );
  await Promise.all(insertPartJobs);

  // then we insert the compositions
  const insertCompositeProductJobs = compositions.map(product =>
    axios.post('http://localhost:3005/v1/products', product, authorizedRequest),
  );
  await Promise.all(insertCompositeProductJobs);
}
