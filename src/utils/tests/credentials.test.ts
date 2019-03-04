import { getGoogleCloudCredentials } from '../credentials';

describe('credentials', () => {

  describe('getGoogleCloudCredentials()', () => {

    it('Should give a correct Google Cloud credentials object.', () => {
      const credentials = getGoogleCloudCredentials();

      expect(credentials.projectId).toBeDefined();
      expect(credentials.credentials).toBeDefined();
      expect(credentials.credentials.client_email).toBeDefined();
      expect(credentials.credentials.private_key).toBeDefined();
    });
  });

});
