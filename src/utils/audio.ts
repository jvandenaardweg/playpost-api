import appRootPath from 'app-root-path';
import fluentFfmpeg from 'fluent-ffmpeg';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import * as musicMetadata from 'music-metadata';

fluentFfmpeg.setFfmpegPath(ffmpeg.path);

/* eslint-disable no-console */
export const getAudioFileDurationInSeconds = async (audioFilePath: string): Promise<number> => {
  console.log('Get audiofile duration in seconds...');

  try {
    const metaData = await musicMetadata.parseFile(audioFilePath, { duration: true });
    const durationInSeconds = metaData.format.duration;
    console.log(`Got audiofile duration: ${durationInSeconds} seconds.`);
    return durationInSeconds;
  } catch (err) {
    throw err;
  }
};

/**
 * Concatinates multiple audiofiles into 1 audiofile
 */
export const concatAudioFiles = async (audioFiles: string[], storageUploadPath: string, encoding: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hrstart = process.hrtime();

    const tempPath = `${appRootPath}/temp`;
    let audioCodec = 'libmp3lame';
    let format = 'mp3';
    let tempFilePath = `${storageUploadPath}.mp3`;
    let outputPath = `${tempPath}/${tempFilePath}`;

    if (encoding === 'OGG_OPUS') {
      audioCodec = 'libopus';
      format = 'ogg';
      tempFilePath = `${storageUploadPath}.opus`;
      outputPath = `${tempPath}/${tempFilePath}`;
    }

    if (!audioFiles.length) reject(new Error('No audiofiles given to concat.'));

    // If we have multiple audiofiles, we concat them
    // First, sort correctly
    audioFiles.sort((a: any, b: any) => b - a); // Sort: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 etc...

    audioFiles.forEach(audioFile => console.log(`Sorted audiofiles, order: ${audioFile}`));
    console.log(`Combining ${audioFiles.length} audio files to one audio file...`);

    return fluentFfmpeg()
    .format(format)
    .audioCodec(audioCodec)
    .input(`concat:${audioFiles.join('|')}`)
    .outputOptions('-acodec copy')
    .save(outputPath)
    .on('error', (err: any) => reject(err))
    .on('end', () => {
      const hrend = process.hrtime(hrstart);
      console.info('Execution time (hr) of concatAudioFiles(): %ds %dms', hrend[0], hrend[1] / 1000000);
      return resolve(outputPath);
    })
    .on('codecData', (data) => {
      console.log('codecData', data);
    });
  });

};
