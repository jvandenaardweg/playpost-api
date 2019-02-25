// require('dotenv').config();
import AWS from 'aws-sdk';
import fs from 'fs-extra';
import appRoot from 'app-root-path';
import { SynthesizerOptions } from '../synthesizers';

// Create an Polly client
const Polly = new AWS.Polly({
  signatureVersion: 'v4',
  region: 'eu-central-1'
});



/* eslint-disable no-console */

export const AWSssmlToSpeech = (mediumPostId: string, ssmlPart: string, index: number, synthesizerOptions: SynthesizerOptions) => {
  return new Promise((resolve, reject) => {
    const audioFilePath = `${appRoot}/temp/${synthesizerOptions.source}/${mediumPostId}/${mediumPostId}-${index}.mp3`;

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

      return fs.writeFile(audioFilePath, response.AudioStream, (writeFileError: any) => {
        if (writeFileError) return reject(new Error(writeFileError));

        console.log(`AWS Polly: Received synthesized audio file for Medium Post ID '${mediumPostId}' SSML part ${index}: ${audioFilePath}`);
        return resolve(audioFilePath);
      });
    });
  });
};

export const AWSssmlPartsToSpeech = (id: string, ssmlParts: Array<string>, synthesizerOptions: SynthesizerOptions) => {
  const promises: Array<any> = [];

  ssmlParts.forEach((ssmlPart, index) => {
    return promises.push(AWSssmlToSpeech(id, ssmlPart, index, synthesizerOptions))
  });

  return Promise.all(promises);
};
