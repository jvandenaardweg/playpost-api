import { User } from '../user';

const examplePassword = 'test';
const examplePasswordHash = '$2a$10$mGMoLtaQRp.7BCB5X0Tu3.Uf6N9Ne46r6brPEEExBtlAU4GojhI/q';

describe('user entity', () => {

  // describe('getAuthenticationToken()', () => {

  //   it('Should return a JWT token after authenticating.', async () => {
  //     const result = await getAuthenticationToken(req, res);

  //     expect(result).toBe('');
  //   });
  // });

  describe('generateJWTAccessToken()', () => {

    it('Should give a JWT token.', () => {
      const token = User.generateJWTAccessToken('1', 'test@playpost.app');

      expect(typeof token).toBe('string');
      expect(token.length).toBe(155);
    });
  });

  describe('hashPassword()', () => {

    it('Should give a encrypted password hash.', async () => {
      const hash = await User.hashPassword(examplePassword);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(60);
    });
  });

  describe('comparePassword()', () => {

    it('Should give return true if password hash matches with plain text one.', async () => {
      const result = await User.comparePassword(examplePassword, examplePasswordHash);

      expect(result).toBe(true);
    });

    it('Should give return false if password hash does not match with plain text one.', async () => {
      const result = await User.comparePassword('invalid', examplePasswordHash);

      expect(result).toBe(false);
    });
  });

  describe('normalizeEmail()', () => {

    it('Should correctly normalize an e-mail address.', async () => {
      const result = await User.normalizeEmail('JoRdyvandenAardweg@gmail.com');

      expect(result).toBe('jordyvandenaardweg@gmail.com');
    });
  });

});
