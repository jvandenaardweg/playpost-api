import * as audioconcat from 'audioconcat';
import fs from 'fs-extra';
import * as mp3Duration from 'mp3-duration';
import { SynthesizerOptions} from '../synthesizers';
import appRoot from 'app-root-path';

/* eslint-disable no-console */

export const getAudioFileDurationInSeconds = async (audioFilePath: string) => {
  console.log('Get audiofile duration in seconds...');

  return new Promise((resolve, reject) => {
    mp3Duration(audioFilePath, (err: Error, durationInSeconds: number) => {
      if (err) return reject(err);

      console.log(`Got audiofile duration: ${durationInSeconds} seconds.`);
      return resolve(durationInSeconds);
    });
  });
};

export const concatAudioFiles = (mediumPostId: string, audioFiles: Array<string>, synthesizerOptions: SynthesizerOptions) => {
  if (!audioFiles.length) throw new Error('No audiofiles given to concat.');

  // If we have just one file, we don't need to concat it
  // We just remove the index number and return the file
  if (audioFiles.length === 1) {
    const audioFile = audioFiles[0];
    const audioFileNameWithoutIndex = audioFile.split('-0.mp3')[0];
    const newAudiofileName = `${audioFileNameWithoutIndex}.mp3`;

    return fs.copy(audioFile, newAudiofileName)
      .then(() => newAudiofileName)
  }

  // If we have multiple audiofiles, we concat them
  // First, sort correctly
  audioFiles.sort((a: any, b: any) => b - a); // Sort: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 etc...

  audioFiles.forEach(audioFile => console.log(`Sorted audiofiles, order: ${audioFile}`));

  console.log(`Combining ${audioFiles.length} audio files to one audio file...`);

  const outputPath = `${appRoot}/temp/${synthesizerOptions.source}/${mediumPostId}/${mediumPostId}.mp3`;

  return audioconcat(audioFiles)
    .concat(outputPath)
    .on('error', (err: any) => new Error(err))
    .on('end', () => outputPath);
};
