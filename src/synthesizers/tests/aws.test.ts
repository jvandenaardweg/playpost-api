import { AwsSynthesizer } from '../aws';

jest.mock('fs-extra');

import mockedAwsVoices from '../../../tests/__mocks/awsVoices';

describe('Synthesizer: AWS', () => {

  describe('getAllVoices()', () => {
    const exampleErrorMessage = 'Example error';

    test('Should return all the AWS voices', async () => {
      const awsSynthesizer = new AwsSynthesizer();

      // @ts-ignore
      // Mock the AWS method
      awsSynthesizer.client.describeVoices = jest.fn((callback) => callback('', { Voices: mockedAwsVoices }));

      const voices = await awsSynthesizer.getAllVoices();

      expect(voices).toEqual(mockedAwsVoices);
    });

    test('Should return an error when there is an error', async () => {
      const awsSynthesizer = new AwsSynthesizer();

      // @ts-ignore
      // Mock the AWS method
      awsSynthesizer.client.describeVoices = jest.fn((callback) => callback(exampleErrorMessage, null));

      try {
        await awsSynthesizer.getAllVoices();
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
    const exampleSynthesizerOptions = {
      OutputFormat: 'mp3',
      Text: exampleSsmlPart,
      VoiceId: 'Kimberly'
    };
    const exampleResponse = {
      AudioStream: 'asdasdasdad'
    }

    test('Should return a temporary filepath of the saved file', async () => {
      const awsSynthesizer = new AwsSynthesizer();

      // @ts-ignore
      // Mock the AWS method
      awsSynthesizer.client.synthesizeSpeech = jest.fn(({}, callback) => callback('', exampleResponse));

      const storageUploadPath = await awsSynthesizer.SSMLToSpeech(exampleIndex, exampleSsmlPart, 'article', '', exampleSynthesizerOptions, exampleStorageUploadPath);

      // The root path is different on each environment, so just check if a part of the string is in there
      expect(storageUploadPath.includes(expectedTempLocalAudiofilePath)).toBe(true);
    });

    test('Should return a error when synthesizeSpeech has an error', async () => {
      const awsSynthesizer = new AwsSynthesizer();
      const exampleError = 'SSML To Speech failed';

      // @ts-ignore
      awsSynthesizer.client.synthesizeSpeech = jest.fn(({}, callback) => callback(exampleError, null));

      try {
        await awsSynthesizer.SSMLToSpeech(exampleIndex, exampleSsmlPart, 'article', '', exampleSynthesizerOptions, exampleStorageUploadPath);
      } catch (err) {
        expect(err).toEqual(exampleError);
      }

    });

    test('Should return a error when saveTempFile has an error', async () => {
      const awsSynthesizer = new AwsSynthesizer();
      const exampleSaveFileError = 'Failed to save file.';

      // @ts-ignore
      // Mock a successful synthesizeSpeech method
      awsSynthesizer.client.synthesizeSpeech = jest.fn(({}, callback) => callback('', exampleResponse));

      // Mock a saveTempFile error
      awsSynthesizer.saveTempFile = jest.fn().mockRejectedValue(exampleSaveFileError);

      try {
        await awsSynthesizer.SSMLToSpeech(exampleIndex, exampleSsmlPart, 'article', '', exampleSynthesizerOptions, exampleStorageUploadPath);
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

    const exampleSynthesizerOptions = {
      OutputFormat: 'mp3',
      Text: '',
      VoiceId: 'Kimberly'
    };

    test('Should return a temporary filepath of the saved file', async () => {
      const awsSynthesizer = new AwsSynthesizer();

      // @ts-ignore
      // Mock SSMLToSpeech
      awsSynthesizer.SSMLToSpeech = (index) => jest.fn().mockResolvedValue(`${exampleStorageUploadPath}-${index}.mp3`)();

      const storageUploadPaths = await awsSynthesizer.SSMLPartsToSpeech(exampleSsmlParts, 'article', '', exampleSynthesizerOptions, exampleStorageUploadPath);

      // The root path is different on each environment, so just check if a part of the string is in there
      expect(storageUploadPaths[0].includes(expectedPath1)).toBe(true);
      expect(storageUploadPaths[1].includes(expectedPath2)).toBe(true);
    });

    test('Should run removeAllTempFiles when SSMLPartsToSpeech has an error', async () => {
      const awsSynthesizer = new AwsSynthesizer();
      const exampleError = 'Some error happened';

      awsSynthesizer.removeAllTempFiles = jest.fn();

      // @ts-ignore
      // Mock SSMLToSpeech
      awsSynthesizer.SSMLToSpeech = (index) => jest.fn().mockRejectedValue(exampleError)();

      try {
        await awsSynthesizer.SSMLPartsToSpeech(exampleSsmlParts, 'article', '', exampleSynthesizerOptions, exampleStorageUploadPath);
      } catch (err) {
        expect(err).toBe(exampleError);
        expect(awsSynthesizer.removeAllTempFiles).toHaveBeenCalledTimes(1);
      }

    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

  })
})
