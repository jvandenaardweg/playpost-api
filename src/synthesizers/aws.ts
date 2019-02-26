import AWS from 'aws-sdk';
import fsExtra from 'fs-extra';
import appRootPath from 'app-root-path';
import { SynthesizerOptions } from '../synthesizers';

// Create an Polly client
const Polly = new AWS.Polly({
  signatureVersion: 'v4',
  region: 'eu-central-1'
});



/* eslint-disable no-console */

export const awsSsmlToSpeech = (mediumPostId: string, ssmlPart: string, index: number, synthesizerOptions: SynthesizerOptions): Promise<string | {}> => {
  return new Promise((resolve, reject) => {
    const audioFilePath = `${appRootPath}/temp/${synthesizerOptions.source}/${mediumPostId}/${mediumPostId}-${index}.mp3`;

    // TODO: use SSML
    // TODO: use voice from synthesizerOptions
    const params = {
      Text: 'Hi, my name is @anaptfox.',
      OutputFormat: 'mp3',
      VoiceId: 'Kimberly'
    };

    Polly.synthesizeSpeech(params, (synthesizeSpeechError: any, response: any) => {
      if (synthesizeSpeechError) return reject(new Error(synthesizeSpeechError));

      if (!response) return reject(new Error('AWS Polly: Received no response from synthesizeSpeech()'));

      if (!(response.AudioStream instanceof Buffer)) return reject(new Error('AWS Polly: Received AudioStream is not an instance of Buffer.'));

      return fsExtra.writeFile(audioFilePath, response.AudioStream, (writeFileError: any) => {
        if (writeFileError) return reject(new Error(writeFileError));

        console.log(`AWS Polly: Received synthesized audio file for Medium Post ID '${mediumPostId}' SSML part ${index}: ${audioFilePath}`);
        return resolve(audioFilePath);
      });
    });
  });
};

export const awsSsmlPartsToSpeech = (id: string, ssmlParts: string[], synthesizerOptions: SynthesizerOptions) => {
  const promises: Promise<any>[] = [];

  ssmlParts.forEach((ssmlPart: string, index: number) => {
    return promises.push(awsSsmlToSpeech(id, ssmlPart, index, synthesizerOptions))
  });

  return Promise.all(promises);
};
