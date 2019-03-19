import { trimTextAtWords } from '../string';

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

});
