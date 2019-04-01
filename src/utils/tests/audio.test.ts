import { concatAudioFiles, getAudioFileDurationInSeconds } from '../audio';
import appRootPath from 'app-root-path';
import fsExtra from 'fs-extra';

const exampleFile1 = `${appRootPath}/src/mocks/audio/example-file-1.mp3`;
const exampleFile2 = `${appRootPath}/src/mocks/audio/example-file-2.mp3`;
const exampleOpusFile1 = `${appRootPath}/src/mocks/audio/opus-example-file-1.opus`;
const exampleOpusFile2 = `${appRootPath}/src/mocks/audio/opus-example-file-2.opus`;
const exampleWrongFile = `${appRootPath}/src/mocks/audio/wrong-file.js`;
const exampleFileConcatinated = `${appRootPath}/src/mocks/audio/example-concatinated.mp3`;
const exampleOpusFileConcatinated = `${appRootPath}/src/mocks/audio/opus-example-concatinated.opus`;
const expectedOutput = `${appRootPath}/temp/example-concatinated.mp3`;
const expectedOpusOutput = `${appRootPath}/temp/example-concatinated.opus`;
const expectedDurationInSecondsFile1 = 27.74204081632653;
const expectedDurationInSecondsFile2 = 45.32244897959184;
const expectedDurationOutput = 73.06448979591836;
const expectedOpusDurationOutput = 231.98758333333333;

describe('audio', () => {

  afterAll(async () => {
    await fsExtra.remove(expectedOutput);
    await fsExtra.remove(expectedOpusOutput);
  });

  describe('concatAudioFiles()', () => {

    describe('mp3', () => {
      it('Should concatenate 2 mp3 audiofiles into one.', async () => {
        const filePath = await concatAudioFiles([exampleFile1, exampleFile2], 'example-concatinated', 'MP3');
        expect(filePath).toBe(expectedOutput);
      });
  
      it('Should also concatinate with 1 mp3 audiofile.', async () => {
        const filePath = await concatAudioFiles([exampleFile1], 'example-concatinated', 'MP3');
        expect(filePath).toBe(expectedOutput);
      });
  
      it('Should throw an error when no files to concatinate are given.', async () => {
        try {
          await concatAudioFiles([], 'example-concatinated', 'MP3');
        } catch (e) {
          expect(e.message).toBeDefined();
        }
      });
  
      it('Should throw an error when concatinating mp3 fails.', async () => {
        try {
          await concatAudioFiles([exampleWrongFile, exampleWrongFile], 'example-concatinated', 'MP3');
        } catch (e) {
          expect(e.message).toBeDefined();
        }
      });
    });

    describe('ogg opus', () => {

      it('Should concatenate 2 opus audiofiles into one.', async () => {
        const filePath = await concatAudioFiles([exampleOpusFile1, exampleOpusFile2], 'example-concatinated', 'OGG_OPUS');
        expect(filePath).toBe(expectedOpusOutput);
      });
  
      it('Should concatenate 1 opus audiofiles into one.', async () => {
        const filePath = await concatAudioFiles([exampleOpusFile1], 'example-concatinated', 'OGG_OPUS');
        expect(filePath).toBe(expectedOpusOutput);
      });
  
      it('Should throw an error when no files to concatinate are given.', async () => {
        try {
          await concatAudioFiles([], 'example-concatinated', 'OGG_OPUS');
        } catch (e) {
          expect(e.message).toBeDefined();
        }
      });
  
      it('Should throw an error when concatinating opus fails.', async () => {
        try {
          await concatAudioFiles([exampleWrongFile, exampleWrongFile], 'example-concatinated', 'OGG_OPUS');
        } catch (e) {
          expect(e.message).toBeDefined();
        }
      });
  
      it('Should concatenate 2 opus audiofiles into one.', async () => {
        const filePath = await concatAudioFiles([exampleOpusFile1, exampleOpusFile2], 'example-concatinated', 'OGG_OPUS');
        expect(filePath).toBe(expectedOpusOutput);
      });
  
    });

  });



  describe('getAudioFileDurationInSeconds()', () => {

    it('Should give the correct audio length.', async () => {
      const durationInSecondsFile1 = await getAudioFileDurationInSeconds(exampleFile1);
      const durationInSecondsFile2 = await getAudioFileDurationInSeconds(exampleFile2);

      expect(durationInSecondsFile1).toBe(expectedDurationInSecondsFile1);
      expect(durationInSecondsFile2).toBe(expectedDurationInSecondsFile2);
    });

    it('Should give the correct audio duration of the concatinated mp3 audiofile.', async () => {
      const durationInSeconds = await getAudioFileDurationInSeconds(exampleFileConcatinated);
      expect(durationInSeconds).toBe(expectedDurationOutput);
    });

    it('Should give the correct audio duration of the concatinated opus audiofile.', async () => {
      const durationInSeconds = await getAudioFileDurationInSeconds(exampleOpusFileConcatinated);
      expect(durationInSeconds).toBe(expectedOpusDurationOutput);
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
