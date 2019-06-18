require('dotenv').config();
import { Polly } from 'aws-sdk';
import appRootPath from 'app-root-path';
import fsExtra from 'fs-extra';
import LocaleCode from 'locale-code';
import { getRepository } from 'typeorm';

import { Voice, Gender, Synthesizer } from '../database/entities/voice';

import { SynthesizerType } from './index';
import { logger } from '../utils/logger';
import { Sentry } from '../error-reporter';

// Create an Polly client
const client = new Polly({
  signatureVersion: 'v4',
  region: 'eu-central-1',
});

export interface AWSSynthesizerOptions extends Polly.Types.SynthesizeSpeechInput {}

export const getAllAWSVoices = async (): Promise<Polly.Voice[]> => {
  return new Promise((resolve, reject) => {
    logger.info('AWS Polly: Getting all AWS Polly voices from the API...');

    client.describeVoices({}, (err, data) => {
      if (err) return reject(err);
      if (!data.Voices) return reject('No voices found.');

      logger.info(`AWS Polly: Got ${data.Voices.length} voices from the API...`);
      return resolve(data.Voices);
    });
  });
};

export const addAllAWSVoices = async (loggerPrefix: string) => {
  logger.info(loggerPrefix, 'AWS Polly: Checking if we need to add new voices to the database...');
  const voiceRepository = getRepository(Voice);

  const voices = await getAllAWSVoices();

  for (const voice of voices) {
    const voiceName = voice.Name;
    const voiceLanguageCode = voice.LanguageCode;
    const voiceGender = (voice.Gender === 'Male') ? Gender.MALE : Gender.FEMALE;

    const foundVoice = await voiceRepository.findOne({ name: voiceName });

    if (foundVoice) {
      logger.info(loggerPrefix, `AWS Polly: Voice ${voiceName} already present. We don't need to add it (again) to the database.`);
    } else {
      if (!voiceLanguageCode) {
        logger.info(loggerPrefix, `AWS Polly: Got no LanguageCode for ${voiceName}. We don't add it to the database.`);
      } else {
        const countryCode = LocaleCode.getCountryCode(voiceLanguageCode);

        if (!countryCode) {
          logger.info(loggerPrefix, `AWS Polly: Cannot determine countryCode for ${voiceName}. We don't add it to the database.`);
        } else {

          try {
            const voiceToCreate = await voiceRepository.create({
              countryCode,
              languageCode: voiceLanguageCode,
              name: voiceName,
              label: voiceName,
              gender: voiceGender,
              synthesizer: Synthesizer.AWS
            });

            const createdVoice = await voiceRepository.save(voiceToCreate);

            logger.info(loggerPrefix, 'AWS Polly: Added new voice to database: ', createdVoice.name);
          } catch (err) {
            logger.error(loggerPrefix, 'AWS Polly: Failed to create the voice in the database', err);
            Sentry.captureException(err);
            throw err;
          }
        }
      }
    }
  }

  return voices;
};

export const awsSSMLToSpeech = (
  index: number,
  ssmlPart: string,
  type: SynthesizerType,
  identifier: string,
  synthesizerOptions: AWSSynthesizerOptions,
  storageUploadPath: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const loggerPrefix = 'AWS SSML Part To Speech:';

    // Create a copy of the synthesizerOptions before giving it to the synthesizeSpeech method
    // Note: this seem to fix the problem we had with concurrent requests
    const ssmlPartSynthesizerOptions = Object.assign(synthesizerOptions, {
      Text: ssmlPart
    });

    let extension = 'mp3';

    if (ssmlPartSynthesizerOptions.OutputFormat === 'ogg_vorbis') {
      extension = 'ogg';
    }

    if (ssmlPartSynthesizerOptions.OutputFormat === 'pcm') {
      extension = 'wav';
    }

    const tempLocalAudiofilePath = `${appRootPath}/temp/${storageUploadPath}-${index}.${extension}`;

    // Make sure the path exists, if not, we create it
    fsExtra.ensureFileSync(tempLocalAudiofilePath);

    // tslint:disable max-line-length
    logger.info(loggerPrefix, 'Synthesizing:', type, index, ssmlPartSynthesizerOptions.LanguageCode, ssmlPartSynthesizerOptions.VoiceId, tempLocalAudiofilePath);

    // Performs the Text-to-Speech request
    return client.synthesizeSpeech(ssmlPartSynthesizerOptions, (err, response) => {
      if (err) {
        logger.error(loggerPrefix, 'Synthesizing failed for:', type, index, ssmlPartSynthesizerOptions.LanguageCode, ssmlPartSynthesizerOptions.VoiceId, tempLocalAudiofilePath);
        logger.error(err);
        return reject(err);
      }

      logger.info(loggerPrefix, 'Received synthesized audio for:', type, index, ssmlPartSynthesizerOptions.LanguageCode, ssmlPartSynthesizerOptions.VoiceId, tempLocalAudiofilePath);

      // Write the binary audio content to a local file
      return fsExtra.writeFile(tempLocalAudiofilePath, response.AudioStream, 'binary', (writeFileError) => {
        if (writeFileError) {
          logger.error(loggerPrefix, `Writing temporary file for synthesized SSML part ${index} failed.`, writeFileError);
          return reject(writeFileError);
        }

        logger.info(loggerPrefix, `Finished part ${index}. Wrote file to: `, tempLocalAudiofilePath);
        return resolve(tempLocalAudiofilePath);
      });
    });
  });
};

/**
 * Synthesizes the SSML parts into seperate audiofiles
 */
export const awsSSMLPartsToSpeech = async (
  ssmlParts: string[],
  type: SynthesizerType,
  identifier: string,
  synthesizerOptions: AWSSynthesizerOptions,
  storageUploadPath: string
) => {
  const promises: Promise<string>[] = [];
  const loggerPrefix = 'AWS SSML Parts To Speech:';

  logger.info(loggerPrefix, 'Starting...');

  ssmlParts.forEach((ssmlPart: string, index: number) => {
    // Create a copy of the synthesizerOptions before giving it to the ssmlToSpeech method
    // Note: this seem to fix the problem we had with concurrent requests
    const synthesizerOptionsCopy = Object.assign({}, synthesizerOptions);
    promises.push(awsSSMLToSpeech(index, ssmlPart, type, identifier, synthesizerOptionsCopy, storageUploadPath));
  });

  logger.info(loggerPrefix, 'Waiting for all SSML part promises to resolve...');

  const tempLocalAudiofilePaths = await Promise.all(promises);

  tempLocalAudiofilePaths.sort((a: any, b: any) => b - a); // Sort: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 etc...

  logger.info(loggerPrefix, 'All SSML part promises resolved. Returning temporary local audiofile paths:', tempLocalAudiofilePaths);

  return tempLocalAudiofilePaths;
};
