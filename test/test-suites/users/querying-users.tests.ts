import axios from 'axios';
import { update } from 'lodash';
import { getCredentials } from '../utils/credentials';
import { cleanUpDatabase, executeQuery } from '../utils/queries';
import usersSenarios from './users.scenarios.json';

describe('update users', () => {
  let authorizedRequest: any;

  beforeAll(async () => {
    authorizedRequest = await getCredentials();

    await cleanUpDatabase();
  });

  it('should update a user data', async () => {
    let name = 'Patrick';
    const email = usersSenarios[0].email;
    const password = 'senha';

    await axios.put('http://localhost:3005/v1/users', { name, email });

    const [updatedUser] = await executeQuery(
      `SELECT name FROM app_user WHERE email='${usersSenarios[0].email}'`,
    );
    expect(updatedUser.name).toBe('Patrick');

    name = 'Patrick Nicezi';
    await axios.put('http://localhost:3005/v1/users', {
      name,
      email,
      password,
    });

    const [updatedUserPassword] = await executeQuery(
      `SELECT name,password FROM app_user WHERE email='${usersSenarios[0].email}'`,
    );
    expect(updatedUserPassword.name).toBe('Patrick Nicezi');
    if (password === usersSenarios[0].password) {
      fail();
    }
  });
});
