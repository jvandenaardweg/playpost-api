import nodeFetch from 'node-fetch';

describe('users', () => {

  describe('anonymous integration test', () => {

    it('Anonymous users should have access to the POST /users endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/users', { method: 'POST' });
      expect(response.status).not.toBe(401);
    });

    it('Anonymous users do not have access to the GET /users endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/users', { method: 'GET' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the DELETE /users/:userId endpoint.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/users/93f43c1b-aad3-406e-ad34-110ef77573da', { method: 'DELETE' });
      expect(response.status).toBe(401);
    });
  });
});
