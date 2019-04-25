import fsExtra from 'fs-extra';
import textToSpeech from '@google-cloud/text-to-speech';
import appRootPath from 'app-root-path';
import { getRepository, createConnection } from 'typeorm';
import LocaleCode from 'locale-code';

import { Voice, Gender, Synthesizer, AudioProfile } from '../database/entities/voice';

import { SynthesizerOptions } from '../synthesizers';
import { getGoogleCloudCredentials } from '../utils/credentials';
import { Article } from 'database/entities/article';
import { Audiofile } from 'database/entities/audiofile';

const client = new textToSpeech.TextToSpeechClient(getGoogleCloudCredentials());

/* eslint-disable no-console */

interface TextToSpeechVoice {
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
      const voiceToCreate = await voiceRepository.create({
        languageCode: voiceLanguageCode,
        countryCode: LocaleCode.getCountryCode(voiceLanguageCode),
        languageName: LocaleCode.getLanguageName(voiceLanguageCode),
        name: voiceName,
        // label: null, // Use default
        gender: voiceGender,
        synthesizer: Synthesizer.GOOGLE,
        // audioProfile: AudioProfile.DEFAULT, // Use default
        // speakingRate: 1, // Use default
        // pitch: 0, // Use default
        naturalSampleRateHertz: voiceNaturalSampleRateHertz,
        // isActive: false, // Use default
        // isPremium: true, // Use default
        // exampleAudioUrl: null // Use default
      });

      const createdVoice = await voiceRepository.save(voiceToCreate);

      console.log('Google Text To Speech: Added new voice to database: ', createdVoice.name);
    }
  }
}

export const googleSsmlToSpeech = (
  index: number,
  ssmlPart: string,
  article: Article,
  audiofile: Audiofile,
  synthesizerOptions: SynthesizerOptions,
  storageUploadPath: string
): Promise<string | {}> => {
  return new Promise((resolve, reject) => {
    const { languageCode, name, encoding } = synthesizerOptions;

    let extension = 'mp3';

    if (encoding === 'OGG_OPUS') {
      extension = 'opus';
    }

    const tempLocalAudiofilePath = `${appRootPath}/temp/${storageUploadPath}-${index}.${extension}`;

    const request = {
      voice: {
        languageCode, // TODO: make based on post language
        name
      },
      input: {
        ssml: ssmlPart
      },
      audioConfig: {
        audioEncoding: encoding
      }
    };

    console.log(`Google Text To Speech: Synthesizing Article ID '${article.id}' SSML part ${index} to '${languageCode}' speech using '${name}' at: ${tempLocalAudiofilePath}`);

    // Make sure the path exists, if not, we create it
    fsExtra.ensureFileSync(tempLocalAudiofilePath);

    // Performs the Text-to-Speech request
    client.synthesizeSpeech(request, (synthesizeSpeechError: any, response: any) => {
      if (synthesizeSpeechError) return reject(new Error(synthesizeSpeechError));

      if (!response) return reject(new Error('Google Text To Speech: Received no response from synthesizeSpeech()'));

      // Write the binary audio content to a local file
      return fsExtra.writeFile(tempLocalAudiofilePath, response.audioContent, 'binary', (writeFileError) => {
        if (writeFileError) return reject(writeFileError);

        console.log(`Google Text To Speech: Received synthesized audio file for Article ID '${article.id}' SSML part ${index}: ${tempLocalAudiofilePath}`);
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
  article: Article,
  audiofile: Audiofile,
  synthesizerOptions: SynthesizerOptions,
  storageUploadPath: string
) => {
  const promises: Promise<any>[] = [];

  ssmlParts.forEach((ssmlPart: string, index: number) => {
    return promises.push(googleSsmlToSpeech(index, ssmlPart, article, audiofile, synthesizerOptions, storageUploadPath));
  });

  return Promise.all(promises);
};
