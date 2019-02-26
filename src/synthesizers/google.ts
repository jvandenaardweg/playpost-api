import fsExtra from 'fs-extra';
import textToSpeech from '@google-cloud/text-to-speech';
import appRootPath from 'app-root-path';
import { SynthesizerOptions } from '../synthesizers';
import { getGoogleCloudCredentials } from '../utils/credentials';

const client = new textToSpeech.TextToSpeechClient(getGoogleCloudCredentials());

/* eslint-disable no-console */

// const AVAILABLE_VOICES = {
//     'en': {
//         languageCode: 'en-US',
//         name: 'en-US-Wavenet-D' // Good sounding male voice
//         // name: 'en-US-Wavenet-F' // Good sounding female voice
//     }
// };

export const googleSsmlToSpeech = (mediumPostId: string, ssmlPart: string, index: number, synthesizerOptions: SynthesizerOptions): Promise<string | {}> => {
  return new Promise((resolve, reject) => {
    const { source, languageCode, name } = synthesizerOptions;
    const audioFilePath = `${appRootPath}/temp/${source}/${mediumPostId}/${mediumPostId}-${index}.mp3`;

    const request = {
      voice: {
        languageCode, // TODO: make based on post language
        name
      },
      input: {
        ssml: ssmlPart
      },
      audioConfig: {
        audioEncoding: 'MP3'
      }
    };

    console.log(`Synthesizing Medium Post ID '${mediumPostId}' SSML part ${index} to '${languageCode}' speech using '${name}' at: ${audioFilePath}`);

    // Make sure the path exists, if not, we create it
    fsExtra.ensureFileSync(audioFilePath);

    // Performs the Text-to-Speech request
    client.synthesizeSpeech(request, (synthesizeSpeechError: any, response: any) => {
      if (synthesizeSpeechError) return reject(new Error(synthesizeSpeechError));

      if (!response) return reject(new Error('Google Text To Speech: Received no response from synthesizeSpeech()'));

      // Write the binary audio content to a local file
      return fsExtra.writeFile(audioFilePath, response.audioContent, 'binary', (writeFileError) => {
        if (writeFileError) return reject(writeFileError);

        console.log(`Google Text To Speech: Received synthesized audio file for Medium Post ID '${mediumPostId}' SSML part ${index}: ${audioFilePath}`);
        return resolve(audioFilePath);
      });
    });
  });
};

export const googleSsmlPartsToSpeech = (id: string, ssmlParts: string[], synthesizerOptions: SynthesizerOptions) => {
  const promises: Promise<any>[] = [];

  ssmlParts.forEach((ssmlPart: string, index: number) => {
    return promises.push(googleSsmlToSpeech(id, ssmlPart, index, synthesizerOptions));
  });

  return Promise.all(promises);
};
