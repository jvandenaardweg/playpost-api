import GoogleTextToSpeech, { AudioEncoding as IGoogleAudioEncoding, SynthesizeSpeechRequest, Voice as IGoogleVoice } from '@google-cloud/text-to-speech';
import * as Sentry from '@sentry/node';
import appRootPath from 'app-root-path';
import LocaleCode from 'locale-code';
import { getRepository } from 'typeorm';

import { EVoiceGender, EVoiceSynthesizer, Voice } from '../database/entities/voice';
import { getGoogleCloudCredentials } from '../utils/credentials';
import { logger } from '../utils/logger';
import { SynthesizerType } from './index';

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

  SSMLToSpeech = (index: number, ssmlPart: string, type: SynthesizerType, identifier: string, synthesizerOptions: GoogleSynthesizerOptions, storageUploadPath: string): Promise<string> => {
    const loggerPrefix = 'Google SSML Part To Speech:';

    return new Promise((resolve, reject) => {
      // Create a copy of the synthesizerOptions before giving it to the synthesizeSpeech method
      // Note: this seem to fix the problem we had with concurrent requests
      const ssmlPartSynthesizerOptions = {...synthesizerOptions,
        input: {
          ssml: ssmlPart
        }
      };

      let extension = 'mp3';

      if (ssmlPartSynthesizerOptions.audioConfig.audioEncoding === 'OGG_OPUS') {
        extension = 'opus';
      }

      if (ssmlPartSynthesizerOptions.audioConfig.audioEncoding === 'LINEAR16') {
        extension = 'wav';
      }

      const tempLocalAudiofilePath = `${appRootPath}/temp/${storageUploadPath}-${index}.${extension}`;

      logger.info(loggerPrefix, `Google Text To Speech: Synthesizing ${type} ID '${identifier}' SSML part ${index} to '${ssmlPartSynthesizerOptions.voice.languageCode}' speech using '${ssmlPartSynthesizerOptions.voice.name}' at: ${tempLocalAudiofilePath}`);

      // Performs the Text-to-Speech request
      return this.client.synthesizeSpeech(ssmlPartSynthesizerOptions, async (err: any, response: any) => {
        if (err) { return reject(err); }

        if (!response) { return reject(new Error('Google Text To Speech: Received no response from synthesizeSpeech()')); }

        // Write the binary audio content to a local file
        try {
          const savedTempLocalAudiofilePath = await this.saveTempFile(tempLocalAudiofilePath, response.audioContent);
          logger.info(loggerPrefix, `Finished part ${index}. Wrote file to: `, tempLocalAudiofilePath);
          resolve(savedTempLocalAudiofilePath);
        } catch (err) {
          logger.error(loggerPrefix, `Writing temporary file for synthesized SSML part ${index} failed.`, err);
          reject(err);
        }
      });
    });
  };

  SSMLPartsToSpeech = async (ssmlParts: string[], type: SynthesizerType, identifier: string, synthesizerOptions: GoogleSynthesizerOptions, storageUploadPath: string) => {
    const promises: Array<Promise<string>> = [];

    try {
      ssmlParts.forEach((ssmlPart: string, index: number) => {
        // Create a copy of the synthesizerOptions before giving it to the ssmlToSpeech method
        // Note: this seem to fix the problem we had with concurrent requests
        const synthesizerOptionsCopy = {...synthesizerOptions};
        promises.push(this.SSMLToSpeech(index, ssmlPart, type, identifier, synthesizerOptionsCopy, storageUploadPath));
      });

      const tempLocalAudiofilePaths = await Promise.all(promises);

      this.tempFilePaths = tempLocalAudiofilePaths;

      tempLocalAudiofilePaths.sort((a: any, b: any) => b - a); // Sort: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 etc...

      return tempLocalAudiofilePaths;
    } catch (err) {
      // Cleanup temp files when there's an error
      await this.removeAllTempFiles();
      throw err;
    }
  };
}
