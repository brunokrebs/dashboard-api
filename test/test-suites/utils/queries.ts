import bcrypt from 'bcryptjs';
import { Client } from 'pg';

export async function executeQuery(query: string) {
  const client = new Client();
  await client.connect();

  const queryResult = await client.query(query);

  await client.end();

  return queryResult.rows;
}

export async function executeQueries(...queries: string[]) {
  const client = new Client();
  await client.connect();

  for (const query of queries) {
    await client.query(query);
  }

  await client.end();
}

export async function cleanUpDatabase() {
  try {
    await executeQueries(
      'delete from sale_order_item;',
      'delete from inventory_movement;',
      'delete from sale_order;',
      'delete from customer;',
      'delete from tag;',
      'delete from inventory;',
      'delete from purchase_order_item;',
      'delete from purchase_order;',
      'delete from supplier;',
      'delete from product_image;',
      'delete from product_composition;',
      'delete from product_variation;',
      'delete from product;',
      'delete from image;',
      'delete from app_user;',
    );

    const password = await bcrypt.hash('lbX01as$', 10);
    await executeQueries(
      `insert into app_user (id, name, email, password) values (1, 'Bruno Krebs', 'bruno.krebs@fridakahlo.com.br', '${password}');`,
      `insert into app_user (id, name, email, password) values (2, 'Lena Vettoretti', 'lena@fridakahlo.com.br', '${password}');`,
    );
  } catch (err) {
    console.error(
      'unable to clean up database, check the sequence of the delete commands;',
    );
    process.exit(1);
  }
}
