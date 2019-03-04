import nodeFetch from 'node-fetch';

describe('catch-all', () => {

  describe('integration test', () => {

    it('All other routes should go to catch all and return a 404.', async () => {
      const response = await nodeFetch('http://localhost:3000/v1/not-a-route', { method: 'GET' });
      expect(response.status).toBe(404);
    });
  });
});
