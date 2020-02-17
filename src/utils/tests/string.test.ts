import { trimTextAtWords, getNormalizedUrl } from '../string';

describe('credentials', () => {

  describe('trimTextAtWords()', () => {

    it('Should correctly trim a string.', () => {
      expect(trimTextAtWords('This is a test.')).toBe('This is a test.');
    });

    it('Should trim a string if the string length is greater then the maxLength.', () => {
      expect(trimTextAtWords('This is a longer test.', 10)).toBe('This is a...');
    });

    it('Should not trim a string if the string length is less then the maxLength.', () => {
      expect(trimTextAtWords('This is a longer test.', 200)).toBe('This is a longer test.');
    });

    it('Should show 3 dots at the end when a text is trimmed.', () => {
      expect(trimTextAtWords('This is a longer test.', 10).endsWith('...')).toBe(true);
    });
  });

  describe('getNormalizedUrl()', () => {
    it('Should remove the trailing slash from a url.', () => {
      expect(getNormalizedUrl('https://www.google.com/')).toBe('https://www.google.com');
    });

    it('Should remove "utm_" parameters from a url.', () => {
      expect(getNormalizedUrl('https://www.google.com?utm_source=playpost&utm_another=another')).toBe('https://www.google.com');
    });

    it('Should sort the query parameters in a url.', () => {
      expect(getNormalizedUrl('https://www.google.com?b=test&a=another')).toBe('https://www.google.com/?a=another&b=test');
    });

    it('Should not strip the www from a url.', () => {
      expect(getNormalizedUrl('https://www.google.com')).toBe('https://www.google.com');
    });

    it('Should normalize the protocol.', () => {
      expect(getNormalizedUrl('//google.com')).toBe('https://google.com');
    });

    it('Should strip the authentication.', () => {
      expect(getNormalizedUrl('https://user:password@google.com')).toBe('https://google.com');
    });
  });

});
