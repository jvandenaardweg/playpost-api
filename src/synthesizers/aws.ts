import * as Sentry from '@sentry/node';
import appRootPath from 'app-root-path';
import AWS, { Polly } from 'aws-sdk';
import LocaleCode from 'locale-code';
import { getRepository } from 'typeorm';

import { EVoiceGender, EVoiceSynthesizer, Voice } from '../database/entities/voice';
import { logger } from '../utils/logger';
import { SynthesizerType } from './index';

export type AWSVoice = Polly.Voice

export class AwsSynthesizer {
  voices: AWSVoice[];
  client: AWS.Polly;

  constructor() {
    AWS.config.update({ region: process.env.AWS_REGION });

    this.client = new Polly({
      signatureVersion: 'v4',
      region: process.env.AWS_REGION
    });
  }

  getAllVoices = async (): Promise<AWSVoice[]> => {
    return new Promise((resolve, reject) => {
      logger.info('AWS Polly: Getting all AWS Polly voices from the API...');

      this.client.describeVoices((err, data) => {
        if (err) { return reject(err); }
        if (!data.Voices) { return reject('No voices found.'); }

        logger.info(`AWS Polly: Got ${data.Voices.length} voices from the API...`);

        this.voices = data.Voices;

        return resolve(this.voices);
      });
    });
  }

  addAllVoices = async (): Promise<AWSVoice[]> => {
    logger.info('AWS Polly: Checking if we need to add new voices to the database...');
    const voiceRepository = getRepository(Voice);
    const availableVoices = await voiceRepository.find();

    const voices = await this.getAllVoices();

    for (const voice of voices) {
      const voiceId = voice.Id;
      const voiceName = voice.Name;
      const voiceLanguageCode = voice.LanguageCode;
      const voiceGender = voice.Gender === 'Male' ? EVoiceGender.MALE : EVoiceGender.FEMALE;

      const foundVoice = availableVoices.find(availableVoice => availableVoice.name === voiceId);

      if (foundVoice) {
        logger.info(`AWS Polly: Voice ${voiceId} already present. We don't need to add it (again) to the database.`);
      } else {
        if (!voiceLanguageCode) {
          logger.warn(`AWS Polly: Got no LanguageCode for ${voiceId}. We don't add it to the database.`);
        } else {
          let countryCode = LocaleCode.getCountryCode(voiceLanguageCode);

          if (voiceLanguageCode === 'cmn-CN') {
            // cmn-CH is Chinese Mandarin
            countryCode = LocaleCode.getCountryCode('zh-CN')
          }

          if (!countryCode) {
            logger.warn(`AWS Polly: Cannot determine countryCode for ${voiceId}. We don't add it to the database.`, voice);
          } else {
            try {
              const voiceToCreate = voiceRepository.create({
                countryCode,
                languageCode: voiceLanguageCode,
                name: voiceId,
                label: voiceName,
                gender: voiceGender,
                synthesizer: EVoiceSynthesizer.AWS
              });

              const createdVoice = await voiceRepository.save(voiceToCreate);

              logger.info('AWS Polly: Added new voice to database: ', createdVoice.name);
            } catch (err) {
              logger.error('AWS Polly: Failed to create the voice in the database', err);

              Sentry.withScope(scope => {
                scope.setLevel(Sentry.Severity.Critical);
                scope.setExtra('voice', voice);
                scope.setExtra('foundVoice', foundVoice);
                scope.setExtra('countryCode', countryCode);
                Sentry.captureException(err);
              });

              throw err;
            }
          }
        }
      }
    }

    return voices;
  };

  SSMLToSpeech = (index: number, ssmlPart: string, type: SynthesizerType, identifier: string, synthesizerOptions: Polly.Types.SynthesizeSpeechInput, storageUploadPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const loggerPrefix = 'AWS SSML Part To Speech:';

      // Create a copy of the synthesizerOptions before giving it to the synthesizeSpeech method
      // Note: this seem to fix the problem we had with concurrent requests
      const ssmlPartSynthesizerOptions = {...synthesizerOptions, 
        Text: ssmlPart};

      let extension = 'mp3';

      if (ssmlPartSynthesizerOptions.OutputFormat === 'ogg_vorbis') {
        extension = 'ogg';
      }

      if (ssmlPartSynthesizerOptions.OutputFormat === 'pcm') {
        extension = 'wav';
      }

      const tempLocalAudiofilePath = `${appRootPath}/temp/${storageUploadPath}-${index}.${extension}`;

      // tslint:disable max-line-length
      logger.info(loggerPrefix, 'Synthesizing:', type, index, ssmlPartSynthesizerOptions.LanguageCode, ssmlPartSynthesizerOptions.VoiceId, tempLocalAudiofilePath);

      // Performs the Text-to-Speech request
      return this.client.synthesizeSpeech(ssmlPartSynthesizerOptions, async (err, response) => {
        if (err) {
          logger.error(loggerPrefix, 'Synthesizing failed for:', type, index, ssmlPartSynthesizerOptions.LanguageCode, ssmlPartSynthesizerOptions.VoiceId, tempLocalAudiofilePath);
          logger.error(err);
          return reject(err);
        }

        logger.info(loggerPrefix, 'Received synthesized audio for:', type, index, ssmlPartSynthesizerOptions.LanguageCode, ssmlPartSynthesizerOptions.VoiceId, tempLocalAudiofilePath);

        // Write the binary audio content to a local file
        try {
          const savedTempLocalAudiofilePath = await this.saveTempFile(tempLocalAudiofilePath, response.AudioStream);
          logger.info(loggerPrefix, `Finished part ${index}. Wrote file to: `, tempLocalAudiofilePath);
          resolve(savedTempLocalAudiofilePath);
        } catch (err) {
          logger.error(loggerPrefix, `Writing temporary file for synthesized SSML part ${index} failed.`, err);
          reject(err);
        }
      });
    });
  };

}
