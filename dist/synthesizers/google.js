"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const fs_extra_1 = __importDefault(require("fs-extra"));
const text_to_speech_1 = __importDefault(require("@google-cloud/text-to-speech"));
const credentials_1 = require("../utils/credentials");
const client = new text_to_speech_1.default.TextToSpeechClient(credentials_1.getGoogleCloudCredentials());
/* eslint-disable no-console */
// const AVAILABLE_VOICES = {
//     'en': {
//         languageCode: 'en-US',
//         name: 'en-US-Wavenet-D' // Good sounding male voice
//         // name: 'en-US-Wavenet-F' // Good sounding female voice
//     }
// };
exports.GooglessmlToSpeech = (mediumPostId, ssmlPart, index, synthesizerOptions) => {
    return new Promise((resolve, reject) => {
        const audioFilePath = `${global.appRoot}/temp/${synthesizerOptions.source}/${mediumPostId}/${mediumPostId}-${index}.mp3`;
        const request = {
            voice: {
                languageCode: synthesizerOptions.languageCode,
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
        fs_extra_1.default.ensureFileSync(audioFilePath);
        // Performs the Text-to-Speech request
        client.synthesizeSpeech(request, (synthesizeSpeechError, response) => {
            if (synthesizeSpeechError)
                return reject(new Error(synthesizeSpeechError));
            if (!response)
                return reject(new Error('Google Text To Speech: Received no response from synthesizeSpeech()'));
            // Write the binary audio content to a local file
            return fs_extra_1.default.writeFile(audioFilePath, response.audioContent, 'binary', (writeFileError) => {
                if (writeFileError)
                    return reject(writeFileError);
                console.log(`Google Text To Speech: Received synthesized audio file for Medium Post ID '${mediumPostId}' SSML part ${index}: ${audioFilePath}`);
                return resolve(audioFilePath);
            });
        });
    });
};
exports.GooglessmlPartsToSpeech = (id, ssmlParts, synthesizerOptions) => {
    const promises = [];
    ssmlParts.forEach((ssmlPart, index) => {
        return promises.push(exports.GooglessmlToSpeech(id, ssmlPart, index, synthesizerOptions));
    });
    return Promise.all(promises);
};
//# sourceMappingURL=google.js.map