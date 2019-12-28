import { GoogleSynthesizer } from '../google';

import mockedGoogleVoices from '../../../tests/__mocks/googleVoices';

jest.mock('fs-extra');

describe('Synthesizer: Google', () => {
  describe('getAllVoices()', () => {
    const exampleErrorMessage = 'Example error';

    test('Should return all the Google voices', async () => {
      const googleSynthesizer = new GoogleSynthesizer();

      // @ts-ignore
      // Mock the Google method
      googleSynthesizer.client.listVoices = jest.fn().mockResolvedValue([{ voices: mockedGoogleVoices }]);

      const voices = await googleSynthesizer.getAllVoices();

      expect(voices).toEqual(mockedGoogleVoices);
    });

    test('Should return an error when there is an error', async () => {
      const googleSynthesizer = new GoogleSynthesizer();

      // @ts-ignore
      // Mock the AWS method
      googleSynthesizer.client.listVoices = jest.fn().mockRejectedValue(exampleErrorMessage);

      try {
        await googleSynthesizer.getAllVoices();
      } catch (err) {
        expect(err).toEqual(exampleErrorMessage);
      }
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

  })
})
