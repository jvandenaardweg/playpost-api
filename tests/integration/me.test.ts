import nodeFetch from 'node-fetch';

import { createTestUser, deleteTestUser, authenticateTestUser, testUserCredentials, baseUrl } from '../test-setup';

describe('me', () => {

  describe('anonymous integration test', () => {

    it('Anonymous users do not have access to the GET /me endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me`, { method: 'GET' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the GET /me/playlists endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me/playlists`, { method: 'GET' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the GET /me/audiofiles endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me/audiofiles`, { method: 'GET' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the GET /me/audiofiles endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me/audiofiles`, { method: 'GET' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the PATCH /me/email endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me/email`, { method: 'PATCH' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the PATCH /me/password endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me/password`, { method: 'PATCH' });
      expect(response.status).toBe(401);
    });

    it('Anonymous users do not have access to the DELETE /me endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me`, { method: 'DELETE' });
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

    it('Authenticated user could access his account endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me`, { headers, method: 'GET' });
      const json = await response.json();
      expect(response.status).toBe(200);
    });

    it('Authenticated user /me endpoint contains correct data.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me`, { headers, method: 'GET' });
      const json = await response.json();
      expect(json.email).toBe(testUserCredentials.email);
      expect(json.password).toBeFalsy();
    });

    it('Authenticated user has a default playlist.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me/playlists`, { headers, method: 'GET' });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json[0].name).toBe('Default');
    });

    it('Authenticated user could access his articles endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me/articles`, { headers, method: 'GET' });
      expect(response.status).toBe(200);
    });

    it('Authenticated user could access his audiofiles endpoint.', async () => {
      const response = await nodeFetch(`${baseUrl}/v1/me/audiofiles`, { headers, method: 'GET' });
      expect(response.status).toBe(200);
    });

    it('Authenticated user can change his password.', async () => {
      const updatedPassword = JSON.stringify({
        password: 'updated'
      });

      const response = await nodeFetch(`${baseUrl}/v1/me/password`, { headers, method: 'PATCH', body: updatedPassword });
      expect(response.status).toBe(200);
    });

    // Last
    it('Authenticated user can change his e-mail address.', async () => {
      const updatedEmail = JSON.stringify({
        email: 'ingegration-updated-email@readtoapp.com'
      });

      const response = await nodeFetch(`${baseUrl}/v1/me/email`, { headers, method: 'PATCH', body: updatedEmail });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.email).toBe('ingegration-updated-email@readtoapp.com');
    });
  });
});
