import fsExtra from 'fs-extra';
import textToSpeech from '@google-cloud/text-to-speech';
import appRootPath from 'app-root-path';
import { getRepository } from 'typeorm';
import LocaleCode from 'locale-code';

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

export const googleSsmlToSpeech = (
  index: number,
  ssmlPart: string,
  type: SynthesizerType,
  identifier: string,
  synthesizerOptions: GoogleSynthesizerOptions,
  storageUploadPath: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
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

    // Performs the Text-to-Speech request
    client.synthesizeSpeech(synthesizerOptions, (synthesizeSpeechError: any, response: any) => {
      if (synthesizeSpeechError) return reject(new Error(synthesizeSpeechError));

      if (!response) return reject(new Error('Google Text To Speech: Received no response from synthesizeSpeech()'));

      // Write the binary audio content to a local file
      return fsExtra.writeFile(tempLocalAudiofilePath, response.audioContent, 'binary', (writeFileError) => {
        if (writeFileError) return reject(writeFileError);

        console.log(`Google Text To Speech: Received synthesized audio file for ${type} ID '${identifier}' SSML part ${index}: ${tempLocalAudiofilePath}`);
        return resolve(tempLocalAudiofilePath);
      });
    });
  });
};

/**
 * Synthesizes the SSML parts into seperate audiofiles
 */
export const googleSsmlPartsToSpeech = (
  ssmlParts: string[],
  type: SynthesizerType,
  identifier: string,
  synthesizerOptions: GoogleSynthesizerOptions,
  storageUploadPath: string
) => {
  const promises: Promise<any>[] = [];

  ssmlParts.forEach((ssmlPart: string, index: number) => {
    return promises.push(googleSsmlToSpeech(index, ssmlPart, type, identifier, synthesizerOptions, storageUploadPath));
  });

  return Promise.all(promises);
};
