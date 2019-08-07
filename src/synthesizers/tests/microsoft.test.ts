import { MicrosoftSynthesizer } from '../microsoft';

// import mockedGoogleVoices from '../../../tests/__mocks/googleVoices';

jest.mock('fs-extra');

describe('Synthesizer: Microsoft', () => {
  describe('authorize()', () => {

    test('Should return the access token', async () => {
      const microsoftSynthesizer = new MicrosoftSynthesizer();

      // @ts-ignore
      // Mock the Google method
      // googleSynthesizer.client.listVoices = jest.fn().mockResolvedValue([{ voices: mockedGoogleVoices }]);

      const accessToken = await microsoftSynthesizer.authorize();

      expect(accessToken).toBeDefined();
      expect(microsoftSynthesizer.accessToken).toBeDefined();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

  })

  describe('getAllVoices()', () => {

    test('Should return all the Microsoft voices', async () => {
      const microsoftSynthesizer = new MicrosoftSynthesizer();

      // @ts-ignore
      // Mock the Google method
      // googleSynthesizer.client.listVoices = jest.fn().mockResolvedValue([{ voices: mockedGoogleVoices }]);

      const voices = await microsoftSynthesizer.getAllVoices();

      expect(voices.length).toBeGreaterThan(10);
      expect(microsoftSynthesizer.voices.length).toBeGreaterThan(10);

      expect(microsoftSynthesizer.voices[0]).toHaveProperty('Name');
      expect(microsoftSynthesizer.voices[0]).toHaveProperty('ShortName');
      expect(microsoftSynthesizer.voices[0]).toHaveProperty('Gender');
      expect(microsoftSynthesizer.voices[0]).toHaveProperty('Locale');
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

  })

  // describe('addAllVoices()', () => {

  //   test('Should add all Microsoft voices to the database', async () => {
  //     const microsoftSynthesizer = new MicrosoftSynthesizer();

  //     // @ts-ignore
  //     // Mock the Google method
  //     // googleSynthesizer.client.listVoices = jest.fn().mockResolvedValue([{ voices: mockedGoogleVoices }]);

  //     const voices = await microsoftSynthesizer.addAllVoices();

  //     expect(voices.length).toBeGreaterThan(10);
  //     expect(microsoftSynthesizer.voices.length).toBeGreaterThan(10);
  //   });

  //   afterAll(() => {
  //     jest.restoreAllMocks();
  //   });

  // })
})
