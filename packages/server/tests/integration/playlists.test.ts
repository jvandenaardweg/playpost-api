import nodeFetch from 'node-fetch';

import { createTestUser, deleteTestUser, authenticateTestUser, baseUrl } from '../test-setup';

describe('playlists', () => {

  describe('anonymous integration test', () => {

    it('Anonymous users do not have access to the GET /playlists endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/playlists`, { method: 'GET' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the POST /playlists endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/playlists`, { method: 'POST' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the GET /playlists/:playlistId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/playlists/72d5ca20-f69f-4b47-b2f4-578d3d1affee`, { method: 'GET' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the POST /playlists/:playlistId/articles/:articleId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/playlists/72d5ca20-f69f-4b47-b2f4-578d3d1affee/articles/a72d2bfe-42c5-4f17-84c0-6b5211d1ab2a`, { method: 'POST' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the DELETE /playlists/:playlistId/articles/:articleId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/playlists/72d5ca20-f69f-4b47-b2f4-578d3d1affee/articles/a72d2bfe-42c5-4f17-84c0-6b5211d1ab2a`, { method: 'DELETE' });
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

    it('Authenticated user does NOT has access to the GET /playlists endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/playlists`, { headers, method: 'GET' });
      expect(response.status).toBe(403);
    });

    it('Authenticated user has access to the POST /playlists endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/playlists`, { headers, method: 'POST' });
      expect([200, 400]).toContain(response.status);
    });

    it('Authenticated user has access to the GET /playlists/:playlistId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/playlists/72d5ca20-f69f-4b47-b2f4-578d3d1affee`, { headers, method: 'GET' });
      expect([200, 400]).toContain(response.status);
    });

    it('Authenticated user has access to the POST /playlists/:playlistId/articles/:articleId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/playlists/72d5ca20-f69f-4b47-b2f4-578d3d1affee/articles/a72d2bfe-42c5-4f17-84c0-6b5211d1ab2a`, { headers, method: 'POST' });
      expect([200, 400]).toContain(response.status);
    });

    it('Authenticated user has access to the DELETE /playlists/:playlistId/articles/:articleId endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/playlists/72d5ca20-f69f-4b47-b2f4-578d3d1affee/articles/a72d2bfe-42c5-4f17-84c0-6b5211d1ab2a`, { headers, method: 'DELETE' });
      expect([200, 400]).toContain(response.status);
    });

  });
});
