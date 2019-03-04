import mp3Duration from 'mp3-duration';
import appRootPath from 'app-root-path';
import fluentFfmpeg from 'fluent-ffmpeg';
import ffmpeg from '@ffmpeg-installer/ffmpeg';

fluentFfmpeg.setFfmpegPath(ffmpeg.path);

/* eslint-disable no-console */

export const getAudioFileDurationInSeconds = async (audioFilePath: string): Promise<number> => {
  console.log('Get audiofile duration in seconds...');

  return new Promise((resolve, reject) => {
    mp3Duration(audioFilePath, (err: Error, durationInSeconds: number) => {
      if (err) return reject(err);

      console.log(`Got audiofile duration: ${durationInSeconds} seconds.`);

      return resolve(durationInSeconds);
    });
  });
};

/**
 * Concatinates multiple audiofiles into 1 audiofile
 */
export const concatAudioFiles = async (audioFiles: string[], storageUploadPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!audioFiles.length) reject(new Error('No audiofiles given to concat.'));

    const tempPath = `${appRootPath}/temp`;
    const tempFilePath = `${storageUploadPath}.mp3`;
    const outputPath = `${tempPath}/${tempFilePath}`;

    // If we have multiple audiofiles, we concat them
    // First, sort correctly
    audioFiles.sort((a: any, b: any) => b - a); // Sort: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 etc...

    audioFiles.forEach(audioFile => console.log(`Sorted audiofiles, order: ${audioFile}`));
    console.log(`Combining ${audioFiles.length} audio files to one audio file...`);

    return fluentFfmpeg()
    .audioCodec('libmp3lame')
    .input(`concat:${audioFiles.join('|')}`)
    .outputOptions('-acodec copy')
    .save(outputPath)
    .on('error', (err: any) => reject(err))
    .on('end', () => resolve(outputPath));

      // return audioconcat(audioFiles)
      //   .concat(outputPath)
      //   .on('error', (err: any) => reject(new Error(err)))
      //   .on('end', () => resolve(outputPath));
  });

};
