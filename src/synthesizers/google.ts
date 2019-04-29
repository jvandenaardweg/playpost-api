require('dotenv').config();
import fsExtra from 'fs-extra';
import textToSpeech from '@google-cloud/text-to-speech';
import appRootPath from 'app-root-path';
import { getRepository } from 'typeorm';
import LocaleCode from 'locale-code';
import nodeFetch from 'node-fetch';

import { Voice, Gender, Synthesizer } from '../database/entities/voice';
import { getGoogleCloudCredentials } from '../utils/credentials';
import { SynthesizerType } from './index';

const client = new textToSpeech.TextToSpeechClient(getGoogleCloudCredentials());

/* eslint-disable no-console */

export type GoogleAudioEncodingType = 'MP3' | 'LINEAR16' | 'OGG_OPUS' | 'AUDIO_ENCODING_UNSPECIFIED';

export interface GoogleSynthesizerOptions {
  input: {
    text?: string,
    ssml?: string
  };
  voice: {
    languageCode: string,
    name: string,
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL' | 'SSML_VOICE_GENDER_UNSPECIFIED'
  };
  audioConfig: {
    audioEncoding: GoogleAudioEncodingType | string,
    speakingRate?: number,
    pitch?: number,
    volumeGainDb?: number,
    sampleRateHertz?: number,
    effectsProfileId?: string[]
  };
}

export interface TextToSpeechVoice {
  languageCodes: string[];
  name: string;
  ssmlGender: Gender;
  naturalSampleRateHertz: number;
}

export const getAllGoogleVoices = async () => {
  const [result] = await client.listVoices({});
  const voices: TextToSpeechVoice[] = result.voices;
  return voices;
};

export const addAllGoogleVoices = async () => {
  console.log('Google Text To Speech: Checking if we need to add new voices to the database...');
  const voiceRepository = getRepository(Voice);
  const voices = await getAllGoogleVoices();

  for (const voice of voices) {
    const voiceName = voice.name;
    const voiceLanguageCode = voice.languageCodes[0];
    const voiceGender = voice.ssmlGender;
    const voiceNaturalSampleRateHertz = voice.naturalSampleRateHertz;

    const foundVoice = await voiceRepository.findOne({ name: voiceName });

    if (foundVoice) {
      console.log(`Google Text To Speech: Voice ${voiceName} already present. We don't need to add it (again) to the database.`);
    } else {
      const countryCode = LocaleCode.getCountryCode(voiceLanguageCode);
      const languageName = LocaleCode.getLanguageName(voiceLanguageCode);

      if (!countryCode || !languageName) {
        console.log(`AWS Polly: Cannot determine countryCode or languageName for ${voiceName}. We don't add it to the database.`);
      } else {
        const voiceToCreate = await voiceRepository.create({
          countryCode,
          languageName,
          languageCode: voiceLanguageCode,
          name: voiceName,
          gender: voiceGender,
          synthesizer: Synthesizer.GOOGLE,
          naturalSampleRateHertz: voiceNaturalSampleRateHertz
        });

        const createdVoice = await voiceRepository.save(voiceToCreate);

        console.log('Google Text To Speech: Added new voice to database: ', createdVoice.name);
      }

    }
  }
}

/**
 * A method to convert text to speech
 *
 * IMPORTANT: "client.synthesizeSpeech" seems to not be able to handle concurrent requests
 * Use "fetchSsmlPartToSpeech" instead.
 */
// export const googleSsmlToSpeech = (
//   index: number,
//   ssmlPart: string,
//   type: SynthesizerType,
//   identifier: string,
//   synthesizerOptions: GoogleSynthesizerOptions,
//   storageUploadPath: string
// ): Promise<string> => {
//   return new Promise((resolve, reject) => {

//     let extension = 'mp3';

//     if (synthesizerOptions.audioConfig.audioEncoding === 'OGG_OPUS') {
//       extension = 'opus';
//     }

//     if (synthesizerOptions.audioConfig.audioEncoding === 'LINEAR16') {
//       extension = 'wav';
//     }

//     synthesizerOptions.input.ssml = ssmlPart;

//     const tempLocalAudiofilePath = `${appRootPath}/temp/${storageUploadPath}-${index}.${extension}`;

//     console.log(`Google Text To Speech: Synthesizing ${type} ID '${identifier}' SSML part ${index} to '${synthesizerOptions.voice.languageCode}' speech using '${synthesizerOptions.voice.name}' at: ${tempLocalAudiofilePath}`);

//     // Make sure the path exists, if not, we create it
//     fsExtra.ensureFileSync(tempLocalAudiofilePath);

//     // Performs the Text-to-Speech request
//     return client.synthesizeSpeech(synthesizerOptions, (err: any, response: any) => {
//       if (err) return reject(err);

//       if (!response) return reject(new Error('Google Text To Speech: Received no response from synthesizeSpeech()'));

//       // Write the binary audio content to a local file
//       return fsExtra.writeFile(tempLocalAudiofilePath, response.audioContent, 'binary', (writeFileError) => {
//         if (writeFileError) return reject(writeFileError);

//         console.log(`Google Text To Speech: Received synthesized audio file for ${type} ID '${identifier}' SSML part ${index}: ${tempLocalAudiofilePath}`);
//         return resolve(tempLocalAudiofilePath);
//       });
//     });
//   });
// };

/**
 * A temporary solution to allow concurrent requests to the Speech API.
 *
 * The library method "synthesizeSpeech" seems to not handle concurrent requests correctly
 * As every audioContent seems the same.
 *
 * Endpoint documentation: https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize
 */
export const googleSsmlToSpeech = (
  index: number,
  ssmlPart: string,
  type: SynthesizerType,
  identifier: string,
  synthesizerOptions: GoogleSynthesizerOptions,
  storageUploadPath: string
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    let extension = 'mp3';

    if (synthesizerOptions.audioConfig.audioEncoding === 'OGG_OPUS') {
      extension = 'opus';
    }

    if (synthesizerOptions.audioConfig.audioEncoding === 'LINEAR16') {
      extension = 'wav';
    }

    synthesizerOptions.input.ssml = ssmlPart;

    const tempLocalAudiofilePath = `${appRootPath}/temp/${storageUploadPath}-${index}.${extension}`;

    console.log(`Google Text To Speech: Synthesizing ${type} ID '${identifier}' SSML part ${index} to '${synthesizerOptions.voice.languageCode}' speech using '${synthesizerOptions.voice.name}' at: ${tempLocalAudiofilePath}`);

    // Make sure the path exists, if not, we create it
    fsExtra.ensureFileSync(tempLocalAudiofilePath);

    try {

      // Get the speech data using the API
      const response = await nodeFetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST',
        body: JSON.stringify(synthesizerOptions),
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_CLOUD_API_KEY
        }
      })
      .then(response => response.json());

      // Turn the base64 data into a buffer, we can use to write to a file
      const buff = new Buffer(response.audioContent, 'base64');

      // Write the a temporary file
      await fsExtra.writeFile(tempLocalAudiofilePath, buff, 'binary');

      console.log(`Google Text To Speech: Received synthesized audio file for ${type} ID '${identifier}' SSML part ${index}: ${tempLocalAudiofilePath}`);

      return resolve(tempLocalAudiofilePath);
    } catch (err) {
      return reject(err);
    }
  });
};

/**
 * Synthesizes the SSML parts into seperate audiofiles
 */
export const googleSsmlPartsToSpeech = async (
  ssmlParts: string[],
  type: SynthesizerType,
  identifier: string,
  synthesizerOptions: GoogleSynthesizerOptions,
  storageUploadPath: string
) => {
  const promises: Promise<string>[] = [];

  ssmlParts.forEach((ssmlPart: string, index: number) => {
    promises.push(googleSsmlToSpeech(index, ssmlPart, type, identifier, synthesizerOptions, storageUploadPath));
  });

  const tempLocalAudiofilePaths = await Promise.all(promises);

  tempLocalAudiofilePaths.sort((a: any, b: any) => b - a); // Sort: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 etc...

  return tempLocalAudiofilePaths;

};
