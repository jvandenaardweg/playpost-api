import { GoogleAudioEncoding, GoogleSynthesizer } from '../google';

import mockedGoogleVoices from '../../../tests/__mocks/googleVoices';

jest.mock('fs-extra');

describe('Synthesizer: Google', () => {
  const exampleSynthesizerOptions = {
    input: {
      ssml: ''
    },
    voice: {
      name: 'ar-XA-Wavenet-C'
    },
    audioConfig: {
      audioEncoding: 'MP3' as GoogleAudioEncoding
    }
  };

  describe('getAllVoices()', () => {
    const exampleErrorMessage = 'Example error';

    test('Should return all the Google voices', async () => {
      const googleSynthesizer = new GoogleSynthesizer();

      // @ts-ignore
      // Mock the Google method
      googleSynthesizer.client.listVoices = jest.fn().mockResolvedValue([{ voices: mockedGoogleVoices }]);

      const voices = await googleSynthesizer.getAllVoices('test');

      expect(voices).toEqual(mockedGoogleVoices);
    });

    test('Should return an error when there is an error', async () => {
      const googleSynthesizer = new GoogleSynthesizer();

      // @ts-ignore
      // Mock the AWS method
      googleSynthesizer.client.listVoices = jest.fn().mockRejectedValue(exampleErrorMessage);

      try {
        await googleSynthesizer.getAllVoices('test');
      } catch (err) {
        expect(err).toEqual(exampleErrorMessage);
      }
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

  })

  describe('SSMLToSpeech()', () => {
    const exampleSsmlPart = '<speak><p>test ssml</p></speak>';
    const exampleIndex = 0;
    const exampleExtension = 'mp3';
    const exampleStorageUploadPath = 'articles/ce57cfa6-6397-4b9c-9e0f-d11b8f6656de/audiofiles/34db4efc-014e-4b9b-85ca-903fdb6a7479';
    const expectedTempLocalAudiofilePath = `/temp/${exampleStorageUploadPath}-${exampleIndex}.${exampleExtension}`;
    const exampleResponse = {
      audioContent: 'asdasdasdad'
    }

    test('Should return a temporary filepath of the saved file', async () => {
      const googleSynthesizer = new GoogleSynthesizer();

      // @ts-ignore
      // Mock the Google method
      googleSynthesizer.client.synthesizeSpeech = jest.fn(({}, callback) => callback('', exampleResponse));

      const storageUploadPath = await googleSynthesizer.SSMLToSpeech(exampleIndex, exampleSsmlPart, 'article', '', exampleSynthesizerOptions, exampleStorageUploadPath, exampleSsmlPart);

      // The root path is different on each environment, so just check if a part of the string is in there
      expect(storageUploadPath.includes(expectedTempLocalAudiofilePath)).toBe(true);

    });

    test('Should return a error when synthesizeSpeech has an error', async () => {
      const googleSynthesizer = new GoogleSynthesizer();
      const exampleError = 'SSML To Speech failed';

      // @ts-ignore
      // Mock the Google method
      googleSynthesizer.client.synthesizeSpeech = jest.fn(({}, callback) => callback(exampleError, null));

      try {
        await googleSynthesizer.SSMLToSpeech(exampleIndex, exampleSsmlPart, 'article', '', exampleSynthesizerOptions, exampleStorageUploadPath, exampleSsmlPart);
      } catch (err) {
        expect(err).toEqual(exampleError);
      }

    });

    test('Should return a error when saveTempFile has an error', async () => {
      const googleSynthesizer = new GoogleSynthesizer();
      const exampleSaveFileError = 'Failed to save file.';

      // @ts-ignore
      // Mock a successful synthesizeSpeech method
      googleSynthesizer.client.synthesizeSpeech = jest.fn(({}, callback) => callback('', exampleResponse));

      // Mock a saveTempFile error
      googleSynthesizer.saveTempFile = jest.fn().mockRejectedValue(exampleSaveFileError);

      try {
        await googleSynthesizer.SSMLToSpeech(exampleIndex, exampleSsmlPart, 'article', '', exampleSynthesizerOptions, exampleStorageUploadPath, exampleSsmlPart);
      } catch (err) {
        expect(err).toEqual(exampleSaveFileError);
      }

    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

  })

  describe('SSMLPartsToSpeech()', () => {
    const exampleSsmlParts = ['<speak><p>test ssml</p></speak>', '<speak><p>test ssml two</p></speak>'];
    const exampleStorageUploadPath = 'articles/ce57cfa6-6397-4b9c-9e0f-d11b8f6656de/audiofiles/34db4efc-014e-4b9b-85ca-903fdb6a7479';
    const expectedPath1 = `${exampleStorageUploadPath}-0.mp3`;
    const expectedPath2 = `${exampleStorageUploadPath}-1.mp3`;

    test('Should return a temporary filepath of the saved file', async () => {
      const googleSynthesizer = new GoogleSynthesizer();

      // @ts-ignore
      // Mock the result of SSMLToSpeech
      googleSynthesizer.SSMLToSpeech = (index) => jest.fn().mockResolvedValue(`${exampleStorageUploadPath}-${index}.mp3`)();

      const storageUploadPaths = await googleSynthesizer.SSMLPartsToSpeech(exampleSsmlParts, 'article', '', exampleSynthesizerOptions, exampleStorageUploadPath, exampleSsmlParts);

      // The root path is different on each environment, so just check if a part of the string is in there
      expect(storageUploadPaths[0].includes(expectedPath1)).toBe(true);
      expect(storageUploadPaths[1].includes(expectedPath2)).toBe(true);
    });

    test('Should run removeAllTempFiles when SSMLPartsToSpeech has an error', async () => {
      const googleSynthesizer = new GoogleSynthesizer();
      const exampleError = 'Some error happened';

      // Mock the removeAllTempFiles method so we can check if it gets called
      googleSynthesizer.removeAllTempFiles = jest.fn();

      // @ts-ignore
      // Mock SSMLToSpeech
      googleSynthesizer.SSMLToSpeech = (index) => jest.fn().mockRejectedValue(exampleError)();

      try {
        await googleSynthesizer.SSMLPartsToSpeech(exampleSsmlParts, 'article', '', exampleSynthesizerOptions, exampleStorageUploadPath, exampleSsmlParts);
      } catch (err) {
        expect(err).toBe(exampleError);
        expect(googleSynthesizer.removeAllTempFiles).toHaveBeenCalledTimes(1);
      }

    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

  })
})
