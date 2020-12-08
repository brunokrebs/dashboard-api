import axios from 'axios';

export const brunoCredentials = {
  username: 'bruno.krebs@fridakahlo.com.br',
  password: 'lbX01as$',
};

export const lenaCrendetials = {
  username: 'lena@fridakahlo.com.br',
  password: 'lbX01as$',
};

export async function getCredentials() {
  const resp = await axios.post(
    'http://localhost:3005/v1/sign-in',
    brunoCredentials,
  );
  const accessToken = resp.data.access_token;

  expect(accessToken).toBeDefined();

  return {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  };
}
