import * as Sentry from '@sentry/node';
import appRootPath from 'app-root-path';
import LocaleCode from 'locale-code';
import nodeFetch, { RequestInit } from 'node-fetch';
import { getRepository } from 'typeorm';

import { EVoiceGender, EVoiceQuality, EVoiceSynthesizer, Voice } from '../database/entities/voice';
import { logger } from '../utils/logger';
import { Synthesizers, SynthesizerType } from './index';

export interface MicrosoftVoice {
  Name: string;
  ShortName: string;
  Gender: string;
  Locale: string;
}

export interface MicrosoftSpeechRequestHeaders {
  method: string;
  headers: {
    'Authorization': string;
    'X-Microsoft-OutputFormat': 'raw-16khz-16bit-mono-pcm' | 'raw-8khz-8bit-mono-mulaw' | 'riff-8khz-8bit-mono-alaw' | 'riff-8khz-8bit-mono-mulaw' | 'riff-16khz-16bit-mono-pcm' | 'audio-16khz-128kbitrate-mono-mp3' | 'audio-16khz-64kbitrate-mono-mp3' | 'audio-16khz-32kbitrate-mono-mp3' | 'raw-24khz-16bit-mono-pcm' | 'riff-24khz-16bit-mono-pcm' | 'audio-24khz-160kbitrate-mono-mp3' | 'audio-24khz-96kbitrate-mono-mp3' | 'audio-24khz-48kbitrate-mono-mp3';
    'Content-Type': string;
    'User-Agent': string;
  };
  body: string;
}

/*
Example voice response:

{
  "Name": "Microsoft Server Speech Text to Speech Voice (ar-EG, Hoda)",
  "ShortName": "ar-EG-Hoda",
  "Gender": "Female",
  "Locale": "ar-EG"
},
*/

export class MicrosoftSynthesizer extends Synthesizers {
  voices: MicrosoftVoice[] = [];
  subscriptionKey = process.env.MICROSOFT_TTS_SUBSCRIPTION_KEY;
  region = 'westeurope';
  accessToken: string | null = null;

  // Microsoft Text to Speech REST API docs:
  // 1. Go to: https://editor.swagger.io/
  // 2. Import URL: https://westeurope.cris.ai/docs/v2.0/swagge

  constructor() {
    super([]);
  }

  authorize = async () => {
    logger.info('Microsoft: Authorizing...');

    const url = `https://${this.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

    if (!this.subscriptionKey) {
      throw new Error('MICROSOFT_TTS_SUBSCRIPTION_KEY is required as an environment variable.');
    }

    const request: RequestInit = {
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': this.subscriptionKey
      }
    }

    const response = await nodeFetch(url, request);

    if (!response.ok) {
      logger.error('Microsoft: ', response);
      throw response;
    }

    const accessToken = await response.text()

    if (!accessToken) {
      const message = 'No accessToken in response.';
      logger.error('Microsoft: ', message);
      throw new Error(message);
    }

    this.accessToken = accessToken;

    logger.info('Microsoft: Authorized!');

    // TODO: save time with it, so we can use the token for 9 minutes
    // info: https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech#how-to-use-an-access-token
    return this.accessToken;
  }

  getAllVoices = async (): Promise<MicrosoftVoice[]> => {
    logger.info('Microsoft Azure: Getting all Microsoft voices from the API...');

    await this.authorize();

    const url = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;

    const request: RequestInit = {
      method: 'get',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    }

    const response = await nodeFetch(url, request);

    if (!response.ok) {
      throw new Error(JSON.stringify(response));
    }

    this.voices = await response.json();

    return this.voices;
  }

  addAllVoices = async (loggerPrefix: string): Promise<MicrosoftVoice[]> => {
    logger.info(loggerPrefix, 'Microsoft Azure: Checking if we need to add new voices to the database...');
    const voiceRepository = getRepository(Voice);

    const voices = await this.getAllVoices();

    for (const voice of voices) {
      const voiceName = voice.ShortName;
      const voiceLanguageCode = voice.Locale;
      const voiceGender = voice.Gender === 'Male' ? EVoiceGender.MALE : EVoiceGender.FEMALE;

      // RUS indicates models based on the concatenative synthesis technology, which is normally higher fidelity, more natural and slightly bigger latency.
      // "Neural": https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#neural-voices
      const voiceQuality = voiceName.includes('Neural') ? EVoiceQuality.VERY_HIGH : voiceName.includes('RUS') ? EVoiceQuality.HIGH : EVoiceQuality.NORMAL;

      // Example: "Microsoft Server Speech Text to Speech Voice (ar-EG, Hoda)"
      // Getting "Hoda" out of that string
      let voiceLabel = voiceName.replace('-Apollo', '');
      voiceLabel = voiceLabel.replace('RUS', '');
      voiceLabel = voiceLabel.replace('24k', '');
      voiceLabel = voiceLabel.replace('Neural', '');
      voiceLabel = voiceLabel.replace(voiceLanguageCode, '');
      voiceLabel = voiceLabel.replace('-', '');

      voiceLabel = (voiceName.includes('24k')) ? voiceLabel + ' K' : voiceLabel;
      voiceLabel = (voiceName.includes('RUS')) ? voiceLabel + ' R' : voiceLabel;
      voiceLabel = (voiceName.includes('Neural')) ? voiceLabel + ' N' : voiceLabel;
      voiceLabel = (voiceName.includes('Apollo')) ? voiceLabel + ' A' : voiceLabel;

      // const labelParts = voice.Name.split(', ');
      // const voiceLabelPart = (labelParts.length) ? labelParts[labelParts.length -1] : '';
      // let voiceLabel = voiceLabelPart.replace(')', '');
      // voiceLabel = voiceLabel.replace('RUS', ' R');
      // voiceLabel = voiceLabel.replace('Neural', ' N');

      const foundVoice = await voiceRepository.findOne({ name: voiceName });

      if (foundVoice) {
        logger.info(loggerPrefix, `Microsoft Azure: Voice ${voiceName} already present. We don't need to add it (again) to the database.`);
      } else {
        if (!voiceLanguageCode) {
          logger.info(loggerPrefix, `Microsoft Azure: Got no LanguageCode for ${voiceName}. We don't add it to the database.`);
        } else {
          let countryCode = LocaleCode.getCountryCode(voiceLanguageCode);

          if (voiceLanguageCode === 'cmn-CN') {
            // cmn-CH is Chinese Mandarin
            countryCode = LocaleCode.getCountryCode('zh-CN')
          }

          if (!countryCode) {
            logger.info(loggerPrefix, `Microsoft Azure: Cannot determine countryCode for ${voiceName}. We don't add it to the database.`, voice);
          } else {
            try {
              const voiceToCreate = await voiceRepository.create({
                countryCode,
                languageCode: voiceLanguageCode,
                name: voiceName,
                label: voiceLabel,
                gender: voiceGender,
                synthesizer: EVoiceSynthesizer.MICROSOFT,
                quality: voiceQuality
              });

              const createdVoice = await voiceRepository.save(voiceToCreate);

              logger.info(loggerPrefix, 'Microsoft Azure: Added new voice to database: ', createdVoice.name);
            } catch (err) {
              logger.error(loggerPrefix, 'Microsoft Azure: Failed to create the voice in the database', err);

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

  SSMLToSpeech = async (index: number, ssmlPart: string, type: SynthesizerType, voice: Voice, storageUploadPath: string): Promise<string> => {
    const loggerPrefix = 'Microsoft SSML Part To Speech:';

    const tempLocalAudiofilePath = `${appRootPath}/temp/${storageUploadPath}-${index}.mp3`;

    // tslint:disable max-line-length
    logger.info(loggerPrefix, 'Synthesizing:', type, index, voice.languageCode, voice.name, tempLocalAudiofilePath);

    // Performs the Text-to-Speech request
    const url = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const voiceGender = (voice.gender === 'MALE') ? 'Male' : 'Female';

    // Make the SSML compatible with how Microsoft wants it
    // Add attributes to <speak> and wrap everything inside <speak> within a <voice> tag
    // Then, properly close it off
    let ssmlPartMS = ssmlPart;
    ssmlPartMS = ssmlPartMS.replace('<speak>', `<speak version='1.0' xml:lang='${voice.languageCode}'><voice xml:lang='${voice.languageCode}' xml:gender='${voiceGender}' name='${voice.name}'>`);
    ssmlPartMS = ssmlPartMS.replace('</speak>', `</voice></speak>`);

    const request: MicrosoftSpeechRequestHeaders = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Microsoft-OutputFormat': 'audio-24khz-160kbitrate-mono-mp3',
        'Content-Type': 'application/ssml+xml',
        'User-Agent': 'Playpost-API'
      },
      body: ssmlPartMS
    }

    try {
      const response = await nodeFetch(url, request);

      if (!response.ok) {
        const error = await response.json();
        logger.error(loggerPrefix, error)
        throw new Error('Did not receive a OK response.');
      }

      const audioBuffer = await response.buffer();

      logger.info(loggerPrefix, 'Received synthesized audio for:', type, index, type, index, voice.languageCode, voice.name, tempLocalAudiofilePath);

      const savedTempLocalAudiofilePath = await this.saveTempFile(tempLocalAudiofilePath, audioBuffer);
      logger.info(loggerPrefix, `Finished part ${index}. Wrote file to: `, tempLocalAudiofilePath);

      return savedTempLocalAudiofilePath;
    } catch (err) {
      logger.error(loggerPrefix, 'Synthesizing failed for:', type, index, type, index, voice.languageCode, voice.name, tempLocalAudiofilePath);
      logger.error(err);
      throw err;
    }
  };

  // /**
  //  * Synthesizes the SSML parts into seperate audiofiles
  //  */
  SSMLPartsToSpeech = async (ssmlParts: string[], type: SynthesizerType, voice: Voice, storageUploadPath: string): Promise<string[]> => {
    const promises: Array<Promise<string>> = [];
    const loggerPrefix = 'Microsoft SSML Parts To Speech:';

    logger.info(loggerPrefix, 'Starting...');

    try {

      await this.authorize();

      ssmlParts.forEach((ssmlPart: string, index: number) => {
        // Create a copy of the synthesizerOptions before giving it to the ssmlToSpeech method
        // Note: this seem to fix the problem we had with concurrent requests
        promises.push(this.SSMLToSpeech(index, ssmlPart, type, voice, storageUploadPath));
      });
  
      logger.info(loggerPrefix, 'Waiting for all SSML part promises to resolve...');

      const tempLocalAudiofilePaths = await Promise.all(promises);

      tempLocalAudiofilePaths.sort((a: any, b: any) => b - a); // Sort: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 etc...

      logger.info(loggerPrefix, 'All SSML part promises resolved. Returning temporary local audiofile paths:', tempLocalAudiofilePaths);

      return tempLocalAudiofilePaths;
    } catch (err) {
      // Cleanup temp files when there's an error
      await this.removeAllTempFiles();

      throw err;
    }
  };

}
