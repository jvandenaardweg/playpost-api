import { getGoogleCloudCredentials } from '../credentials';

describe('credentials', () => {

  describe('getGoogleCloudCredentials()', () => {

    it('Should give a correct Google Cloud credentials object.', () => {
      const credentials = getGoogleCloudCredentials();

      expect(credentials).toHaveProperty('projectId');
      expect(credentials).toHaveProperty('credentials');
      expect(credentials.credentials).toHaveProperty('client_email');
      expect(credentials.credentials).toHaveProperty('private_key');
    });
  });

});
