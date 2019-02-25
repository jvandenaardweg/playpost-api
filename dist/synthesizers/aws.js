"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// Create an Polly client
const Polly = new aws_sdk_1.default.Polly({
    signatureVersion: 'v4',
    region: 'eu-central-1'
});
/* eslint-disable no-console */
exports.AWSssmlToSpeech = (mediumPostId, ssmlPart, index, synthesizerOptions) => {
    return new Promise((resolve, reject) => {
        const audioFilePath = `${global.appRoot}/temp/${synthesizerOptions.source}/${mediumPostId}/${mediumPostId}-${index}.mp3`;
        // TODO: use SSML
        // TODO: use voice from synthesizerOptions
        const params = {
            Text: 'Hi, my name is @anaptfox.',
            OutputFormat: 'mp3',
            VoiceId: 'Kimberly'
        };
        Polly.synthesizeSpeech(params, (synthesizeSpeechError, response) => {
            if (synthesizeSpeechError)
                return reject(new Error(synthesizeSpeechError));
            if (!response)
                return reject(new Error('AWS Polly: Received no response from synthesizeSpeech()'));
            if (!(response.AudioStream instanceof Buffer))
                return reject(new Error('AWS Polly: Received AudioStream is not an instance of Buffer.'));
            return fs_extra_1.default.writeFile(audioFilePath, response.AudioStream, (writeFileError) => {
                if (writeFileError)
                    return reject(new Error(writeFileError));
                console.log(`AWS Polly: Received synthesized audio file for Medium Post ID '${mediumPostId}' SSML part ${index}: ${audioFilePath}`);
                return resolve(audioFilePath);
            });
        });
    });
};
exports.AWSssmlPartsToSpeech = (id, ssmlParts, synthesizerOptions) => {
    const promises = [];
    ssmlParts.forEach((ssmlPart, index) => {
        return promises.push(exports.AWSssmlToSpeech(id, ssmlPart, index, synthesizerOptions));
    });
    return Promise.all(promises);
};
//# sourceMappingURL=aws.js.map