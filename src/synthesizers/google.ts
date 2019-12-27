import GoogleTextToSpeech, { AudioEncoding as IGoogleAudioEncoding, SynthesizeSpeechRequest, Voice as IGoogleVoice } from '@google-cloud/text-to-speech';
import * as Sentry from '@sentry/node';
import LocaleCode from 'locale-code';
import { getRepository } from 'typeorm';

import { EVoiceGender, EVoiceSynthesizer, Voice } from '../database/entities/voice';
import { getGoogleCloudCredentials } from '../utils/credentials';
import { logger } from '../utils/logger';

export type GoogleAudioEncoding = IGoogleAudioEncoding;

export type GoogleVoice = IGoogleVoice;

export type GoogleSynthesizerOptions = SynthesizeSpeechRequest;

export interface ITextToSpeechVoice {
  languageCodes: string[];
  name: string;
  ssmlGender: EVoiceGender;
  naturalSampleRateHertz: number;
}

export class GoogleSynthesizer {
  client: typeof GoogleTextToSpeech.TextToSpeechClient.prototype;

  constructor() {
    this.client = new GoogleTextToSpeech.TextToSpeechClient(getGoogleCloudCredentials());
  }

  getAllVoices = async (): Promise<GoogleVoice[]> => {
    try {
      logger.info('Google Text To Speech: Getting all Google Text To Speech voices from the API...');
      const result = await this.client.listVoices({});
      const voices: GoogleVoice[] = result[0]['voices'];
      logger.info(`Google Text To Speech: Got ${voices.length} voices from the API...`);
      return voices;
    } catch (err) {
      logger.error('Google Text To Speech: Error while getting all the Google Text To Speech voices from the API.', err);

      Sentry.withScope(scope => {
        scope.setLevel(Sentry.Severity.Critical);
        Sentry.captureException(err);
      });

      throw err;
    }
  };

  addAllVoices = async (): Promise<GoogleVoice[]> => {
    logger.info('Google Text To Speech: Checking if we need to add new voices to the database...');

    const voiceRepository = getRepository(Voice);
    const availableVoices = await voiceRepository.find();

    const voices = await this.getAllVoices();

    for (const voice of voices) {
      const voiceName = voice.name;
      // @ts-ignore
      const voiceLanguageCode = voice.languageCodes[0];
      const voiceGender = voice.ssmlGender as EVoiceGender;

      const foundVoice = availableVoices.find(availableVoice => availableVoice.name === voiceName);

      if (foundVoice) {
        logger.info(`Google Text To Speech: Voice ${voiceName} already present. We don't need to add it (again) to the database.`);
      } else {
        let countryCode = LocaleCode.getCountryCode(voiceLanguageCode);

        if (voiceLanguageCode === 'cmn-CN') {
          // cmn-CH is Chinese Mandarin
          countryCode = LocaleCode.getCountryCode('zh-CN')
        }

        if (!countryCode) {
          logger.warn(`Google Text To Speech: Cannot determine countryCode for ${voiceName}. We don't add it to the database.`);
        } else {
          try {
            const voiceToCreate = voiceRepository.create({
              countryCode,
              languageCode: voiceLanguageCode,
              name: voiceName,
              label: voiceName,
              gender: voiceGender,
              synthesizer: EVoiceSynthesizer.GOOGLE
            });

            const createdVoice = await voiceRepository.save(voiceToCreate);

            logger.info('Google Text To Speech: Added new voice to database: ', createdVoice.name);
          } catch (err) {
            logger.error('Google Text To Speech: Failed to create the voice in the database', err);

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

    return voices;
  };
}
