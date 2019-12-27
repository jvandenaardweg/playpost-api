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

})
