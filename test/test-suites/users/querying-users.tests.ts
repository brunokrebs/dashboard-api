import axios from 'axios';
import { getCredentials } from '../utils/credentials';
import { cleanUpDatabase, executeQuery } from '../utils/queries';

describe('update users', () => {
  let authorizedRequest: any;

  const user = {
    name: 'Patrick da Silva Nicezi',
    email: 'patrickk0806@gmail.com',
    password: '1234',
  };

  beforeAll(async () => {
    authorizedRequest = await getCredentials();

    await cleanUpDatabase();
  });

  it('should update a user data', async () => {
    let name = 'Patrick';
    const email = user.email;
    const password = user.password;

    await axios.put(
      'http://localhost:3005/v1/users',
      { name, email },
      authorizedRequest,
    );

    const [updatedUser] = await executeQuery(
      `SELECT name FROM app_user WHERE email='${user.email}'`,
    );
    expect(updatedUser.name).toBe(name);

    name = 'Patrick Nicezi';
    await axios.put(
      'http://localhost:3005/v1/users',
      {
        name,
        email,
        password,
      },
      authorizedRequest,
    );

    const [updatedUserPassword] = await executeQuery(
      `SELECT name,password FROM app_user WHERE email='${user.email}'`,
    );
    expect(updatedUserPassword.name).toBe(name);
    expect(updatedUserPassword.password).not.toBe(user.password);
  });

  it('should not update a user data is empity', async () => {
    let name = ' ';
    const email = user.email;
    const password = '  ';
    try {
      await axios.put(
        'http://localhost:3005/v1/users',
        { name, email },
        authorizedRequest,
      );
      fail('a empity name cannot updated');
    } catch (err) {
      //god expected error
      expect(err).toBeDefined();
    }

    name = user.name;
    try {
      await axios.put(
        'http://localhost:3005/v1/users',
        {
          name,
          email,
          password,
        },
        authorizedRequest,
      );
      fail('a empity password cannot updated');
    } catch (err) {
      //god expected error
      expect(err).toBeDefined();
    }
  });

  it('should not update a user with a invalid email', async () => {
    let name = user.name;
    const email = 'teste@gmail.com';
    try {
      await axios.put('http://localhost:3005/v1/users', {
        name,
        email,
      });
      fail('a invalid email not should updated');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});
