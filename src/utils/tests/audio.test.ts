import { concatAudioFiles, getAudioFileDurationInSeconds } from '../audio';
import appRootPath from 'app-root-path';
import fsExtra from 'fs-extra';

const exampleFile1 = `${appRootPath}/src/mocks/audio/example-file-1.mp3`;
const exampleFile2 = `${appRootPath}/src/mocks/audio/example-file-2.mp3`;
const exampleWrongFile = `${appRootPath}/src/mocks/audio/wrong-file.js`;
const exampleFileConcatinated = `${appRootPath}/src/mocks/audio/example-concatinated.mp3`;
const expectedOutput = `${appRootPath}/temp/example-concatinated.mp3`;
const expectedDurationInSecondsFile1 = 27.742;
const expectedDurationInSecondsFile2 = 45.322;
const expectedDurationOutput = 73.091;

describe('audio', () => {

  afterAll(async () => {
    await fsExtra.remove(expectedOutput);
  });

  describe('concatAudioFiles()', () => {

    it('Should concatenate two audiofiles into one.', async () => {
      const filePath = await concatAudioFiles([exampleFile1, exampleFile2], 'example-concatinated');
      expect(filePath).toBe(expectedOutput);
    });

    it('Should also concatinate with 1 audiofile.', async () => {
      const filePath = await concatAudioFiles([exampleFile1], 'example-concatinated');
      expect(filePath).toBe(expectedOutput);
    });

    it('Should throw an error when no files to concatinate are given.', async () => {
      try {
        await concatAudioFiles([], 'example-concatinated');
      } catch (e) {
        expect(e.message).toBeDefined();
      }
    });

    it('Should throw an error when concatinating fails.', async () => {
      try {
        await concatAudioFiles([exampleWrongFile, exampleWrongFile], 'example-concatinated');
      } catch (e) {
        expect(e.message).toBeDefined();
      }
    });

  });

  describe('getAudioFileDurationInSeconds()', () => {

    it('Should give the correct audio length.', async () => {
      const durationInSecondsFile1 = await getAudioFileDurationInSeconds(exampleFile1);
      const durationInSecondsFile2 = await getAudioFileDurationInSeconds(exampleFile2);

      expect(durationInSecondsFile1).toBe(expectedDurationInSecondsFile1);
      expect(durationInSecondsFile2).toBe(expectedDurationInSecondsFile2);
    });

    it('Should give the correct audio duration of the concatinated audiofile.', async () => {
      const durationInSeconds = await getAudioFileDurationInSeconds(exampleFileConcatinated);
      expect(durationInSeconds).toBe(expectedDurationOutput);
    });

    it('Should throw an error when no file is given.', async () => {
      try {
        await getAudioFileDurationInSeconds('');
      } catch (e) {
        expect(e.message).toBeDefined();
      }
    });
  });
});
