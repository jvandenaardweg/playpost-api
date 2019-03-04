import nodeFetch from 'node-fetch';

import { createTestUser, testUserCredentials, testUserCredentialsStringified, deleteTestUser, authenticateTestUser } from '../../../utils/test-setup';

describe('articles', () => {

  describe('anonymous integration test', () => {

    it('Anonymous users do not have access to the GET /articles/:articleId endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/articles/93f43c1b-aad3-406e-ad34-110ef77573da', { method: 'GET' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the DELETE /articles/:articleId endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/articles/93f43c1b-aad3-406e-ad34-110ef77573da', { method: 'DELETE' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the GET /articles/:articleId/audiofiles endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/articles/93f43c1b-aad3-406e-ad34-110ef77573da/audiofiles', { method: 'GET' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the POST /articles/:articleId/audiofiles endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/articles/93f43c1b-aad3-406e-ad34-110ef77573da/audiofiles', { method: 'POST' });
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

    it('Authenticated user NOT has access to the DELETE /articles/:articleId endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/articles/93f43c1b-aad3-406e-ad34-110ef77573da', { headers, method: 'DELETE' });
      expect([403]).toContain(response.status);
    });

    it('Authenticated user has access to the GET /articles/:articleId endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/articles/93f43c1b-aad3-406e-ad34-110ef77573da', { headers, method: 'GET' });
      expect([200, 400]).toContain(response.status);
    });

    it('Authenticated user has access to the GET /articles/:articleId/audiofiles endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/articles/93f43c1b-aad3-406e-ad34-110ef77573da/audiofiles', { headers, method: 'GET' });
      expect([200, 400]).toContain(response.status);
    });

    it('Authenticated user has access to the POST /articles/:articleId/audiofiles endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/articles/93f43c1b-aad3-406e-ad34-110ef77573da/audiofiles', { headers, method: 'POST' });
      expect([400]).toContain(response.status);
    });
  });
});
