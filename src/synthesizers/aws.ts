require('dotenv').config();
import AWS, { Polly } from 'aws-sdk';
import appRootPath from 'app-root-path';
import fsExtra from 'fs-extra';
import LocaleCode from 'locale-code';
import { getRepository } from 'typeorm';

import { Voice, Gender, Synthesizer } from '../database/entities/voice';

import { Article } from '../database/entities/article';
import { Audiofile } from '../database/entities/audiofile';

// Create an Polly client
const client = new Polly({
  signatureVersion: 'v4',
  region: 'eu-central-1',
});

export interface AWSSynthesizerOptions extends Polly.Types.SynthesizeSpeechInput {}

export const getAllAWSVoices = async (): Promise<Polly.Voice[]> => {
  return new Promise((resolve, reject) => {
    client.describeVoices({}, (err, data) => {
      if (err) return reject(err);
      if (!data.Voices) return reject('No voices found.');
      return resolve(data.Voices);
    });
  });
};

export const addAllAWSVoices = async () => {
  console.log('AWS Polly: Checking if we need to add new voices to the database...');
  const voiceRepository = getRepository(Voice);

  const voices = await getAllAWSVoices();

  for (const voice of voices) {
    const voiceName = voice.Name;
    const voiceLanguageCode = voice.LanguageCode;
    const voiceGender = (voice.Gender === 'Male') ? Gender.MALE : Gender.FEMALE;

    const foundVoice = await voiceRepository.findOne({ name: voiceName });

    if (foundVoice) {
      console.log(`AWS Polly: Voice ${voiceName} already present. We don't need to add it (again) to the database.`);
    } else {
      const voiceToCreate = await voiceRepository.create({
        languageCode: voiceLanguageCode,
        countryCode: LocaleCode.getCountryCode(voiceLanguageCode),
        languageName: LocaleCode.getLanguageName(voiceLanguageCode),
        name: voiceName,
        label: voiceName, // Use default
        gender: voiceGender,
        synthesizer: Synthesizer.AWS,
        // audioProfile: AudioProfile.DEFAULT, // Use default
        // speakingRate: 1, // Use default
        // pitch: 0, // Use default
        // naturalSampleRateHertz: null, // Use default
        // isActive: false, // Use default
        // isPremium: true, // Use default
        // exampleAudioUrl: null // Use default
      });

      const createdVoice = await voiceRepository.save(voiceToCreate);

      console.log('AWS Polly: Added new voice to database: ', createdVoice.name);
    }
  }
}

export const awsSsmlToSpeech = (
  index: number,
  ssmlPart: string,
  article: Article,
  synthesizerOptions: AWSSynthesizerOptions,
  storageUploadPath: string
): Promise<string | {}> => {
  return new Promise((resolve, reject) => {
    const { VoiceId, LanguageCode, OutputFormat, TextType } = synthesizerOptions;

    let extension = 'mp3';

    if (OutputFormat === 'ogg_vorbis') {
      extension = 'ogg';
    }

    const tempLocalAudiofilePath = `${appRootPath}/temp/${storageUploadPath}-${index}.${extension}`;

    const request: Polly.Types.SynthesizeSpeechInput = {
      OutputFormat,
      VoiceId,
      LanguageCode,
      TextType,
      Text: ssmlPart,
    };

    console.log(`AWS Polly: Synthesizing Article ID '${article.id}' SSML part ${index} to '${LanguageCode}' speech using '${VoiceId}' at: ${tempLocalAudiofilePath}`);

    // Make sure the path exists, if not, we create it
    fsExtra.ensureFileSync(tempLocalAudiofilePath);

    // Performs the Text-to-Speech request
    client.synthesizeSpeech(request, (err, response) => {
      if (err) return reject(err);

      if (!response) return reject(new Error('AWS Polly: Received no response from synthesizeSpeech()'));

      // Write the binary audio content to a local file
      return fsExtra.writeFile(tempLocalAudiofilePath, response.AudioStream, 'binary', (writeFileError) => {
        if (writeFileError) return reject(writeFileError);

        console.log(`AWS Polly: Received synthesized audio file for Article ID '${article.id}' SSML part ${index}: ${tempLocalAudiofilePath}`);
        return resolve(tempLocalAudiofilePath);
      });
    });
  });
};

/**
 * Synthesizes the SSML parts into seperate audiofiles
 */
export const awsSsmlPartsToSpeech = (
  ssmlParts: string[],
  article: Article,
  synthesizerOptions: AWSSynthesizerOptions,
  storageUploadPath: string
) => {
  const promises: Promise<any>[] = [];

  ssmlParts.forEach((ssmlPart: string, index: number) => {
    return promises.push(awsSsmlToSpeech(index, ssmlPart, article, synthesizerOptions, storageUploadPath));
  });

  return Promise.all(promises);
};
