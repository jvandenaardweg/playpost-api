import { generateJWTToken, hashPassword, comparePassword } from '../auth';

const examplePassword = 'test';
const examplePasswordHash = '$2a$10$mGMoLtaQRp.7BCB5X0Tu3.Uf6N9Ne46r6brPEEExBtlAU4GojhI/q';

describe('auth controller', () => {

  // describe('getAuthenticationToken()', () => {

  //   it('Should return a JWT token after authenticating.', async () => {
  //     const result = await getAuthenticationToken(req, res);

  //     expect(result).toBe('');
  //   });
  // });

  describe('generateJWTToken()', () => {

    it('Should give a JWT token.', () => {
      const token = generateJWTToken('1', 'jordyvandenaardweg@gmail.com');

      expect(typeof token).toBe('string');
      expect(token.length).toBe(169);
    });
  });

  describe('hashPassword()', () => {

    it('Should give a encrypted password hash.', async () => {
      const hash = await hashPassword(examplePassword);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(60);
    });
  });

  describe('comparePassword()', () => {

    it('Should give return true if password hash matches with plain text one.', async () => {
      const result = await comparePassword(examplePassword, examplePasswordHash);

      expect(result).toBe(true);
    });

    it('Should give return false if password hash does not match with plain text one.', async () => {
      const result = await comparePassword('invalid', examplePasswordHash);

      expect(result).toBe(false);
    });
  });

});
