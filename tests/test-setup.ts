import nodeFetch from 'node-fetch';

const { BASE_API_URL } = process.env;

export const baseUrl = BASE_API_URL;

const headers = {
  'Content-Type': 'application/json',
};

export const testUserCredentials = {
  email: 'integrationtest-1337@readtoapp.com',
  password: 'integrationtest'
};

export const testUserCredentialsStringified = JSON.stringify(testUserCredentials);

export const createTestUser = async () => {
  const user = await nodeFetch(`${BASE_API_URL}/v1/users`, { headers, method: 'POST', body: testUserCredentialsStringified }).then(response => response.json());
  return user;
};

export const authenticateTestUser = async () => {
  const user = await nodeFetch(`${BASE_API_URL}/v1/auth`, { headers, method: 'POST', body: testUserCredentialsStringified }).then(response => response.json());

  headers['Authorization'] = `Bearer ${user.token}`;

  return {
    headers,
    user
  };
};

export const deleteTestUser = async (headers: any) => {
  const response = await nodeFetch(`${BASE_API_URL}/v1/me`, { headers, method: 'DELETE' });
  return response;
};
