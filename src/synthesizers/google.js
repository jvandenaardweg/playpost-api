require('dotenv').config();
const fs = require('fs-extra');
const textToSpeech = require('@google-cloud/text-to-speech');

const { getGoogleCloudCredentials } = require('../utils/credentials');

const client = new textToSpeech.TextToSpeechClient(getGoogleCloudCredentials());

/* eslint-disable no-console */

// const AVAILABLE_VOICES = {
//     'en': {
//         languageCode: 'en-US',
//         name: 'en-US-Wavenet-D' // Good sounding male voice
//         // name: 'en-US-Wavenet-F' // Good sounding female voice
//     }
// };

const ssmlToSpeech = (mediumPostId, ssmlPart, index, synthesizerOptions) => {
  return new Promise((resolve, reject) => {
    const audioFilePath = `${global.appRoot}/temp/${synthesizerOptions.source}/${mediumPostId}/${mediumPostId}-${index}.mp3`;

    const request = {
      voice: {
        languageCode: synthesizerOptions.languageCode, // TODO: make based on post language
        name: synthesizerOptions.name
      },
      input: {
        ssml: ssmlPart
      },
      audioConfig: {
        audioEncoding: 'MP3'
      }
    };

    console.log(`Synthesizing Medium Post ID '${mediumPostId}' SSML part ${index} to '${synthesizerOptions.languageCode}' speech using '${synthesizerOptions.name}' at: ${audioFilePath}`);

    // Make sure the path exists, if not, we create it
    fs.ensureFileSync(audioFilePath);

    // Performs the Text-to-Speech request
    client.synthesizeSpeech(request, (synthesizeSpeechError, response) => {
      if (synthesizeSpeechError) return reject(new Error(synthesizeSpeechError));

      if (!response) return reject(new Error('Google Text To Speech: Received no response from synthesizeSpeech()'));

      // Write the binary audio content to a local file
      return fs.writeFile(audioFilePath, response.audioContent, 'binary', (writeFileError) => {
        if (writeFileError) return reject(new Error(writeFileError));

        console.log(`Google Text To Speech: Received synthesized audio file for Medium Post ID '${mediumPostId}' SSML part ${index}: ${audioFilePath}`);
        return resolve(audioFilePath);
      });
    });
  });
};

const ssmlPartsToSpeech = (id, ssmlParts, synthesizerOptions) => {
  const promises = [];

  ssmlParts.forEach((ssmlPart, index) => {
    return promises.push(ssmlToSpeech(id, ssmlPart, index, synthesizerOptions))
  });

  return Promise.all(promises);
};

module.exports = { ssmlPartsToSpeech };
