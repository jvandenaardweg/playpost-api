import fsExtra from 'fs-extra';
import textToSpeech from '@google-cloud/text-to-speech';
import appRootPath from 'app-root-path';
import { SynthesizerOptions } from '../synthesizers';
import { getGoogleCloudCredentials } from '../utils/credentials';
import { Article } from 'database/entities/article';
import { Audiofile } from 'database/entities/audiofile';

const client = new textToSpeech.TextToSpeechClient(getGoogleCloudCredentials());

/* eslint-disable no-console */

export const getAllVoices = async () => {
  const [result] = await client.listVoices({});
  const voices = result.voices;
   return voices;
};

export const googleSsmlToSpeech = (
  index: number,
  ssmlPart: string,
  article: Article,
  audiofile: Audiofile,
  synthesizerOptions: SynthesizerOptions,
  storageUploadPath: string
): Promise<string | {}> => {
  return new Promise((resolve, reject) => {
    let extension = 'mp3';
    const { languageCode, name, encoding } = synthesizerOptions;
    const articleId = article.id;

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

    console.log(`Google Text To Speech: Synthesizing Article ID '${articleId}' SSML part ${index} to '${languageCode}' speech using '${name}' at: ${tempLocalAudiofilePath}`);

    // Make sure the path exists, if not, we create it
    fsExtra.ensureFileSync(tempLocalAudiofilePath);

    // Performs the Text-to-Speech request
    client.synthesizeSpeech(request, (synthesizeSpeechError: any, response: any) => {
      if (synthesizeSpeechError) return reject(new Error(synthesizeSpeechError));

      if (!response) return reject(new Error('Google Text To Speech: Received no response from synthesizeSpeech()'));

      // Write the binary audio content to a local file
      return fsExtra.writeFile(tempLocalAudiofilePath, response.audioContent, 'binary', (writeFileError) => {
        if (writeFileError) return reject(writeFileError);

        console.log(`Google Text To Speech: Received synthesized audio file for Article ID '${articleId}' SSML part ${index}: ${tempLocalAudiofilePath}`);
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
