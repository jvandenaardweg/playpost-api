import appRootPath from 'app-root-path';
import fluentFfmpeg from 'fluent-ffmpeg';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import * as musicMetadata from 'music-metadata';
import * as Sentry from '@sentry/node';

import { logger } from '../utils';

fluentFfmpeg.setFfmpegPath(ffmpeg.path);

/* eslint-disable no-console */
export const getAudioFileDurationInSeconds = async (audioFilePath: string): Promise<number> => {
  logger.info('Audio Util (Duration): Get audiofile duration in seconds...');

  try {
    const metaData = await musicMetadata.parseFile(audioFilePath, { duration: true });
    const durationInSeconds = metaData.format.duration;
    logger.info(`Audio Util (Duration): Got audiofile duration: ${durationInSeconds} seconds.`);

    // If duration is "undefined", we just return 0
    return durationInSeconds || 0;
  } catch (err) {
    logger.info('Audio Util (Duration): Failed to get audiofile duration.', audioFilePath);

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('audioFilePath', audioFilePath);
      Sentry.captureException(err);
    });

    throw err;
  }
};

/**
 * Concatinates multiple audiofiles into 1 audiofile
 */
export const concatAudioFiles = async (audioFiles: string[], storageUploadPath: string, encoding: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hrstart = process.hrtime();

    logger.info(`Audio Util (Concat): Combining ${audioFiles.length} audiofiles to one audio file...`);

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

    if (!audioFiles.length) {
      const errorMessage = 'No audiofiles given to concat.';
      logger.error('Audio Util (Concat): ', errorMessage);
      reject(new Error(errorMessage));
    }

    return fluentFfmpeg()
      .format(format)
      .audioCodec(audioCodec)
      .input(`concat:${audioFiles.join('|')}`)
      .outputOptions('-acodec copy')
      .save(outputPath)
      .on('error', (err: any) => {
        logger.error('Audio Util (Concat): Concat failed using ffmpeg:', err);
        return reject(err);
      })
      .on('end', () => {
        const hrend = process.hrtime(hrstart);
        const ds = hrend[0];
        const dms = hrend[1] / 1000000;
        logger.info('Audio Util (Concat): Concat success!');
        logger.info(`Audio Util (Concat): Execution time: ${ds} ${dms}ms`);
        return resolve(outputPath);
      })
      .on('codecData', data => {
        logger.info('Audio Util (Concat): Data:', data);
      });
  });
};
