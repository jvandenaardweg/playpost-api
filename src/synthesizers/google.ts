import textToSpeech from '@google-cloud/text-to-speech';
import * as Sentry from '@sentry/node';
import appRootPath from 'app-root-path';
import fsExtra from 'fs-extra';
import LocaleCode from 'locale-code';
import { getRepository } from 'typeorm';

import { Gender, Synthesizer, Voice } from '../database/entities/voice';
import { getGoogleCloudCredentials } from '../utils/credentials';
import { logger } from '../utils/logger';
import { SynthesizerType } from './index';

const client = new textToSpeech.TextToSpeechClient(getGoogleCloudCredentials());

export type GoogleAudioEncodingType = 'MP3' | 'LINEAR16' | 'OGG_OPUS' | 'AUDIO_ENCODING_UNSPECIFIED';

export interface IGoogleSynthesizerOptions {
  input: {
    text?: string;
    ssml?: string;
  };
  voice: {
    languageCode: string;
    name: string;
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL' | 'SSML_VOICE_GENDER_UNSPECIFIED';
  };
  audioConfig: {
    audioEncoding: GoogleAudioEncodingType | string;
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
    sampleRateHertz?: number;
    effectsProfileId?: string[];
  };
}

export interface ITextToSpeechVoice {
  languageCodes: string[];
  name: string;
  ssmlGender: Gender;
  naturalSampleRateHertz: number;
}

export const getAllGoogleVoices = async (loggerPrefix: string) => {
  try {
    logger.info(loggerPrefix, 'Google Text To Speech: Getting all Google Text To Speech voices from the API...');
    const [result] = await client.listVoices({});
    const voices: ITextToSpeechVoice[] = result.voices;
    logger.info(loggerPrefix, `Google Text To Speech: Got ${voices.length} voices from the API...`);
    return voices;
  } catch (err) {
    logger.error(loggerPrefix, 'Google Text To Speech: Error while getting all the Google Text To Speech voices from the API.', err);

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      Sentry.captureException(err);
    });

    throw err;
  }
};

export const addAllGoogleVoices = async (loggerPrefix: string) => {
  logger.info(loggerPrefix, 'Google Text To Speech: Checking if we need to add new voices to the database...');

  const voiceRepository = getRepository(Voice);

  const voices = await getAllGoogleVoices(loggerPrefix);

  for (const voice of voices) {
    const voiceName = voice.name;
    const voiceLanguageCode = voice.languageCodes[0];
    const voiceGender = voice.ssmlGender;
    const voiceNaturalSampleRateHertz = voice.naturalSampleRateHertz;

    const foundVoice = await voiceRepository.findOne({ name: voiceName });

    if (foundVoice) {
      logger.warn(loggerPrefix, `Google Text To Speech: Voice ${voiceName} already present. We don't need to add it (again) to the database.`);
    } else {
      const countryCode = LocaleCode.getCountryCode(voiceLanguageCode);

      if (!countryCode) {
        logger.warn(loggerPrefix, `Google Text To Speech: Cannot determine countryCode for ${voiceName}. We don't add it to the database.`);
      } else {
        try {
          const voiceToCreate = await voiceRepository.create({
            countryCode,
            languageCode: voiceLanguageCode,
            name: voiceName,
            label: voiceName,
            gender: voiceGender,
            synthesizer: Synthesizer.GOOGLE,
            naturalSampleRateHertz: voiceNaturalSampleRateHertz,
            isHighestQuality: voiceName.toLowerCase().includes('wavenet') ? true : false
          });

          const createdVoice = await voiceRepository.save(voiceToCreate);

          logger.info(loggerPrefix, 'Google Text To Speech: Added new voice to database: ', createdVoice.name);
        } catch (err) {
          logger.error(loggerPrefix, 'Google Text To Speech: Failed to create the voice in the database', err);

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

export const googleSSMLToSpeech = (index: number, ssmlPart: string, type: SynthesizerType, identifier: string, synthesizerOptions: IGoogleSynthesizerOptions, storageUploadPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create a copy of the synthesizerOptions before giving it to the synthesizeSpeech method
    // Note: this seem to fix the problem we had with concurrent requests
    const ssmlPartSynthesizerOptions = {...synthesizerOptions, 
      input: {
        ssml: ssmlPart
      }};

    let extension = 'mp3';

    if (ssmlPartSynthesizerOptions.audioConfig.audioEncoding === 'OGG_OPUS') {
      extension = 'opus';
    }

    if (ssmlPartSynthesizerOptions.audioConfig.audioEncoding === 'LINEAR16') {
      extension = 'wav';
    }

    const tempLocalAudiofilePath = `${appRootPath}/temp/${storageUploadPath}-${index}.${extension}`;

    logger.info(`Google Text To Speech: Synthesizing ${type} ID '${identifier}' SSML part ${index} to '${ssmlPartSynthesizerOptions.voice.languageCode}' speech using '${ssmlPartSynthesizerOptions.voice.name}' at: ${tempLocalAudiofilePath}`);

    // Make sure the path exists, if not, we create it
    fsExtra.ensureFileSync(tempLocalAudiofilePath);

    // Performs the Text-to-Speech request
    return client.synthesizeSpeech(ssmlPartSynthesizerOptions, (err: any, response: any) => {
      if (err) { return reject(err); }

      if (!response) { return reject(new Error('Google Text To Speech: Received no response from synthesizeSpeech()')); }

      // Write the binary audio content to a local file
      return fsExtra.writeFile(tempLocalAudiofilePath, response.audioContent, 'binary', writeFileError => {
        if (writeFileError) { return reject(writeFileError); }

        logger.info(`Google Text To Speech: Received synthesized audio file for ${type} ID '${identifier}' SSML part ${index}: ${tempLocalAudiofilePath}`);
        return resolve(tempLocalAudiofilePath);
      });
    });
  });
};

/**
 * Synthesizes the SSML parts into seperate audiofiles
 */
export const googleSSMLPartsToSpeech = async (ssmlParts: string[], type: SynthesizerType, identifier: string, synthesizerOptions: IGoogleSynthesizerOptions, storageUploadPath: string) => {
  const promises: Array<Promise<string>> = [];

  ssmlParts.forEach((ssmlPart: string, index: number) => {
    // Create a copy of the synthesizerOptions before giving it to the ssmlToSpeech method
    // Note: this seem to fix the problem we had with concurrent requests
    const synthesizerOptionsCopy = {...synthesizerOptions};
    promises.push(googleSSMLToSpeech(index, ssmlPart, type, identifier, synthesizerOptionsCopy, storageUploadPath));
  });

  const tempLocalAudiofilePaths = await Promise.all(promises);

  tempLocalAudiofilePaths.sort((a: any, b: any) => b - a); // Sort: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 etc...

  return tempLocalAudiofilePaths;
};
