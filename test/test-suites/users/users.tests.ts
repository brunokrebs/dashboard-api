import axios from 'axios';
import { UserProfileDTO } from '../../../src/users/user-profile.dto';
import { getCredentials, brunoCredentials } from '../utils/credentials';
import { cleanUpDatabase, executeQuery } from '../utils/queries';

describe('update users', () => {
  let authorizedRequest: any;

  beforeAll(async () => {
    authorizedRequest = await getCredentials();

    await cleanUpDatabase();
  });

  it('should have access to its own profile', async () => {
    const { data: profile } = await axios.get(
      'http://localhost:3005/v1/users',
      authorizedRequest,
    );
    expect(profile.email).toBe(brunoCredentials.username);
  });

  it('should be able to update its own profile', async () => {
    const newProfile: UserProfileDTO = {
      name: 'Bruno S. Krebs',
    };

    // tries to update them, while logged in as Bruno
    await axios.put(
      'http://localhost:3005/v1/users',
      newProfile,
      authorizedRequest,
    );

    // gets their details after the attempt
    const [user] = await executeQuery(
      `SELECT name FROM app_user WHERE email = '${brunoCredentials.username}'`,
    );

    // check if details did not change
    expect(user.name).toBe(newProfile.name);
  });

  it('should be able to sign in after updating profile', async () => {
    const newProfile: UserProfileDTO = {
      name: 'Bruno S. Krebs',
    };

    await axios.put(
      'http://localhost:3005/v1/users',
      newProfile,
      authorizedRequest,
    );

    const res = await axios.post(
      'http://localhost:3005/v1/sign-in',
      brunoCredentials,
    );
    expect(res).toBeDefined();
  });

  it('should be able to sign in after updating profile with password', async () => {
    const newProfile: UserProfileDTO = {
      name: 'Bruno S. Krebs',
      password: '12345555',
    };

    await axios.put(
      'http://localhost:3005/v1/users',
      newProfile,
      authorizedRequest,
    );

    try {
      await axios.post('http://localhost:3005/v1/sign-in', brunoCredentials);
      fail('should not be allowed to user old password');
    } catch (err) {
      // no op
    }

    const res = await axios.post('http://localhost:3005/v1/sign-in', {
      ...brunoCredentials,
      password: newProfile.password,
    });
    expect(res).toBeDefined();
  });

  it('should not update other users', async () => {
    // defines an existing user (based on valid email)
    const otherUserUpdate = {
      name: 'Random Name',
      email: 'lena@fridakahlo.com.br',
    };

    // gets their details before trying to update
    const [otherUserBeforeUpdate] = await executeQuery(
      `SELECT name FROM app_user WHERE email = '${otherUserUpdate.email}'`,
    );

    // tries to update them, while logged in as Bruno
    await axios.put(
      'http://localhost:3005/v1/users',
      otherUserUpdate,
      authorizedRequest,
    );

    // gets their details after the attempt
    const [user] = await executeQuery(
      `SELECT name FROM app_user WHERE email = '${otherUserUpdate.email}'`,
    );

    // check if details did not change
    expect(user.name).not.toBe(otherUserUpdate.name);
    expect(user.name).toBe(otherUserBeforeUpdate.name);

    // gets their details after the attempt
    const [loggedInUser] = await executeQuery(
      `SELECT name FROM app_user WHERE email = '${brunoCredentials.username}'`,
    );

    // check if details did not change
    expect(loggedInUser.name).toBe(otherUserUpdate.name);
  });

  it('should validate properties before updating', async () => {
    const newProfile = {
      name: '',
    };

    try {
      await axios.put(
        'http://localhost:3005/v1/users',
        newProfile,
        authorizedRequest,
      );
      fail('should not be allowed to set invalid values');
    } catch (err) {
      // no op
    }

    newProfile.name = '     ';

    try {
      await axios.put(
        'http://localhost:3005/v1/users',
        newProfile,
        authorizedRequest,
      );
      fail('should not be allowed to set invalid values');
    } catch (err) {
      // no op
    }
  });

  it('should ignore undefined/null values for password', async () => {
    const newProfile = {
      name: 'Bruno',
      password: null,
    };

    await axios.put(
      'http://localhost:3005/v1/users',
      newProfile,
      authorizedRequest,
    );

    // gets their details after the update
    const [userDetails1] = await executeQuery(
      `SELECT name FROM app_user WHERE email = '${brunoCredentials.username}'`,
    );

    // check if details did not change
    expect(userDetails1.name).toBe(newProfile.name);

    await axios.put(
      'http://localhost:3005/v1/users',
      { ...newProfile, password: undefined },
      authorizedRequest,
    );

    // gets their details after the update
    const [userDetails2] = await executeQuery(
      `SELECT name FROM app_user WHERE email = '${brunoCredentials.username}'`,
    );

    // check if details did not change
    expect(userDetails2.name).toBe(newProfile.name);
  });
});
