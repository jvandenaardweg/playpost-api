import nodeFetch from 'node-fetch';

import { createTestUser, deleteTestUser, authenticateTestUser, baseUrl } from '../test-setup';

describe('users', () => {

  describe('anonymous integration test', () => {

    it('Anonymous users should have access to the POST /users endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/users`, { method: 'POST' });
      expect(response.status).not.toBe(401);
    });

    it('Anonymous users do not have access to the GET /users endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/users`, { method: 'GET' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the DELETE /users/:userId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/users/93f43c1b-aad3-406e-ad34-110ef77573da`, { method: 'DELETE' });
      expect(response.status).toBe(401);
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

    it('Authenticated users should have access to the POST /users endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/users`, { headers, method: 'POST' });
      expect(response.status).not.toBe(403);
    });

    it('Authenticated users do not have access to the GET /users endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/users`, { headers, method: 'GET' });
      expect(response.status).toBe(403);
    });

    it('Authenticated users do not have access to the DELETE /users/:userId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/users/93f43c1b-aad3-406e-ad34-110ef77573da`, { headers, method: 'DELETE' });
      expect(response.status).toBe(403);
    });

  });
});
