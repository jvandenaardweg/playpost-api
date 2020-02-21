import { getAnonymousUserId, createAlternativeAnonymousUserId, createAnonymousUserId } from '../anonymous-user-id';

describe('anonymous-user-id', () => {

  describe('getAnonymousUserId()', () => {

    it('Should return the cookie value of "getAnonymousUserId" if present.', () => {
      const req = {
        cookies: {
          'anonymousUserId': 'example',
        }
      } as any
      expect(getAnonymousUserId(req)).toBe('example');
    });

    it('Should return an alternative anonymous id based on ip  value when cookie value "getAnonymousUserId" is not present.', () => {
      const req = {
        cookies: {
          'anonymousUserId': undefined,
        },
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          'x-forwarded-for': '5.6.7.8',
          'user-agent': 'Test Agent',
          'accept-language': 'en-US',
          'accept': '*/*',
          'DNT': 0
        },
        'ip': '5.4.3.2',
        get: jest.fn()
      } as any
      expect(getAnonymousUserId(req)).toBe('e9596a0953f480a2b71598985e23ff20');
    });
  });

  describe('createAlternativeAnonymousUserId()', () => {
    it('Should return an alternative anonymous user id.', () => {
      const req = {
        cookies: {
          'anonymousUserId': undefined,
        },
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          'x-forwarded-for': '5.6.7.8',
          'user-agent': 'Test Agent',
          'accept-language': 'en-US',
          'accept': '*/*',
          'DNT': 0
        },
        'ip': '5.4.3.2',
        get: jest.fn()
      } as any
      expect(createAlternativeAnonymousUserId(req)).toBe('e9596a0953f480a2b71598985e23ff20');
    });
  });

  describe('createAnonymousUserId()', () => {
    it('Should return generate a random string.', () => {
      expect(createAnonymousUserId()).toHaveLength(32);
    });
  })

});
