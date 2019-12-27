import * as Sentry from '@sentry/node';
import AWS, { Polly } from 'aws-sdk';
import LocaleCode from 'locale-code';
import { getRepository } from 'typeorm';

import { EVoiceGender, EVoiceSynthesizer, Voice } from '../database/entities/voice';
import { logger } from '../utils/logger';

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

}
