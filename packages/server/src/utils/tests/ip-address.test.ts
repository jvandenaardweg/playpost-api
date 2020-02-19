import { getRealUserIpAddress } from '../ip-address';

describe('ip-address', () => {

  describe('getRealUserIpAddress()', () => {

    it('Should prefer the "cf-connecting-ip" out of other options.', () => {
      const req = {
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          'x-forwarded-for': '5.6.7.8',
        },
        'ip': '5.4.3.2'
      } as any
      expect(getRealUserIpAddress(req)).toBe('1.2.3.4');
    });

    it('Should prefer the "x-forwarded-for" when "cf-connecting-ip" is not given.', () => {
      const req = {
        headers: {
          // 'cf-connecting-ip': '1.2.3.4',
          'x-forwarded-for': '5.6.7.8',
        },
        'ip': '5.4.3.2'
      } as any
      expect(getRealUserIpAddress(req)).toBe('5.6.7.8');
    });

    it('Should prefer the "ip" when "cf-connecting-ip" ánd "x-forwarded-for" is not given.', () => {
      const req = {
        headers: {
          // 'cf-connecting-ip': '1.2.3.4',
          // 'x-forwarded-for': '5.6.7.8',
        },
        'ip': '5.4.3.2'
      } as any
      expect(getRealUserIpAddress(req)).toBe('5.4.3.2');
    });

    it('Should return undefined when none could be found (not realistic scenario).', () => {
      const req = {
        headers: {
          // 'cf-connecting-ip': '1.2.3.4',
          // 'x-forwarded-for': '5.6.7.8',
        },
        // 'ip': '5.4.3.2'
      } as any
      expect(getRealUserIpAddress(req)).toBeUndefined();
    });
  });

});
