import { detectLanguage } from '../detect-language';

describe('ssml', () => {

  describe('detectLanguage()', () => {

    it('Should detect the correct language.', () => {
      const exampleEnglish = 'This is an example text to be detected as "eng".';
      const exampleDutch = 'Dit is een voorbeeldtekst die moet worden gedetecteerd als "nld".';
      const exampleGerman = 'Dies ist ein Beispieltext, der als erkannt werden soll "deu".';
      const exampleFrench = 'Ceci est un exemple de texte à détecter en tant que "fra".';

      const english = detectLanguage(exampleEnglish);
      const dutch = detectLanguage(exampleDutch);
      const german = detectLanguage(exampleGerman);
      const french = detectLanguage(exampleFrench);

      expect(english).toBe('eng');
      expect(dutch).toBe('nld');
      expect(german).toBe('deu');
      expect(french).toBe('fra');
    });
  });
});
