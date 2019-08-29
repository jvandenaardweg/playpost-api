import { ApiKey } from '../api-key';

describe('user entity', () => {

  describe('generateApiKey()', () => {

    it('should generate a random API Key', () => {
      const apiKey = ApiKey.generateApiKey();

      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBe(64);
    });
  });

  describe('generateApiSecret()', () => {

    it('should generate a random API Secret', () => {
      const apiKey = ApiKey.generateApiSecret();

      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBe(64);
    });
  });

  describe('generateApiKeySignature()', () => {

    it('should generate a signature based on the API Key and API Secret', () => {
      const signature = ApiKey.generateApiKeySignature('some-api-key', 'some-api-secret');

      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64);
    });
  });

  describe('isValidSignature()', () => {

    it('should return true if signature and Api Key and Api Secret provide the same signature', () => {
      const exampleApiKey = 'some-api-key';
      const exampleApiSecret = 'some-api-secret';

      const signature = ApiKey.generateApiKeySignature(exampleApiKey, exampleApiSecret);
      const isValidSignature = ApiKey.isValidSignature(exampleApiKey, exampleApiSecret, signature);

      expect(isValidSignature).toBe(true);
    });

    it('should return false if signature and Api Key and Api Secret does not provide the same signature', () => {
      const exampleApiKey = 'some-api-key';
      const exampleApiSecret = 'some-api-secret';

      const signature = ApiKey.generateApiKeySignature(exampleApiKey, exampleApiSecret);
      const isValidSignature = ApiKey.isValidSignature(exampleApiKey, 'some-different-secret', signature);

      expect(isValidSignature).toBe(false);
    });
  });

});
