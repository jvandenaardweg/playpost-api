import nodeFetch from 'node-fetch';

import { createTestUser, testUserCredentials, testUserCredentialsStringified, deleteTestUser, authenticateTestUser } from '../../../utils/test-setup';

const headers = {
  'Content-Type': 'application/json',
};

describe('auth', () => {

  describe('anonymous integration test', () => {

    it('Anonymous users should have access to the POST /auth endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/auth', { method: 'POST' });
      expect(response.status).not.toBe(401);
    });

    it('Anonymous user should get an error when email does not exist.', async () => {
      const wrongCredentials = {
        ...testUserCredentials,
        email: 'integration-test-does-not-exist@readtoapp.com'
      };

      const response = await nodeFetch('http://localhost:3000/v1/auth', { headers, method: 'POST', body: JSON.stringify(wrongCredentials) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.message).toBe('No user found or password is incorrect.');
    });
  });

  describe('authenticated integration test', () => {
    let headers: any;

    beforeAll(async () => {
      await createTestUser();
      const authenticatedUser = await authenticateTestUser();
      headers = authenticatedUser.headers;
    });

    afterAll(async () => {
      await deleteTestUser(headers);
    });

    it('User should get an error when password is incorrect.', async () => {
      const wrongCredentials = {
        ...testUserCredentials,
        password: 'wrong'
      };

      const response = await nodeFetch('http://localhost:3000/v1/auth', { headers, method: 'POST', body: JSON.stringify(wrongCredentials) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.message).toBe('Password is incorrect.');
    });

    it('User should get a token when credentials are correct.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/auth', { headers, method: 'POST', body: testUserCredentialsStringified });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.token).toBeTruthy();
      expect(typeof json.token).toBe('string');
    });
  });
});
