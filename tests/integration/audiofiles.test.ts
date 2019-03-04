import nodeFetch from 'node-fetch';

import { createTestUser, deleteTestUser, authenticateTestUser, baseUrl } from '../test-setup';

describe('audiofiles', () => {

  describe('anonymous integration test', () => {

    it('Anonymous users do not have access to the GET /audiofiles endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/audiofiles`, { method: 'GET' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the DELETE /audiofiles/:audiofileId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/audiofiles/93f43c1b-aad3-406e-ad34-110ef77573da`, { method: 'DELETE' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the GET /audiofiles/:audiofileId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/audiofiles/93f43c1b-aad3-406e-ad34-110ef77573da`, { method: 'GET' });
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

    it('Authenticated users do NOT have access to the GET /audiofiles endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/audiofiles`, { headers, method: 'GET' });
      expect(response.status).toBe(403);
    });

    it('Authenticated users do have access to the GET /audiofiles/:audiofileId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/audiofiles/93f43c1b-aad3-406e-ad34-110ef77573da`, { headers, method: 'GET' });
      expect([200, 400]).toContain(response.status);
    });

    it('Authenticated users do NOT have access to the DELETE /audiofiles/:audiofileId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/audiofiles/93f43c1b-aad3-406e-ad34-110ef77573da`, { headers, method: 'DELETE' });
      expect(response.status).toBe(403);
    });
  });
});
