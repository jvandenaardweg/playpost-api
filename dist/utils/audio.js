"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const audioconcat = __importStar(require("audioconcat"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const mp3Duration = __importStar(require("mp3-duration"));
/* eslint-disable no-console */
exports.getAudioFileDurationInSeconds = (audioFilePath) => __awaiter(this, void 0, void 0, function* () {
    console.log('Get audiofile duration in seconds...');
    return new Promise((resolve, reject) => {
        mp3Duration(audioFilePath, (err, durationInSeconds) => {
            if (err)
                return reject(err);
            console.log(`Got audiofile duration: ${durationInSeconds} seconds.`);
            return resolve(durationInSeconds);
        });
    });
});
exports.concatAudioFiles = (mediumPostId, audioFiles, synthesizerOptions) => {
    if (!audioFiles.length)
        throw new Error('No audiofiles given to concat.');
    // If we have just one file, we don't need to concat it
    // We just remove the index number and return the file
    if (audioFiles.length === 1) {
        const audioFile = audioFiles[0];
        const audioFileNameWithoutIndex = audioFile.split('-0.mp3')[0];
        const newAudiofileName = `${audioFileNameWithoutIndex}.mp3`;
        return fs_extra_1.default.copy(audioFile, newAudiofileName)
            .then(() => newAudiofileName);
    }
    // If we have multiple audiofiles, we concat them
    // First, sort correctly
    audioFiles.sort((a, b) => b - a); // Sort: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 etc...
    audioFiles.forEach(audioFile => console.log(`Sorted audiofiles, order: ${audioFile}`));
    console.log(`Combining ${audioFiles.length} audio files to one audio file...`);
    const outputPath = `${global.appRoot}/temp/${synthesizerOptions.source}/${mediumPostId}/${mediumPostId}.mp3`;
    return audioconcat(audioFiles)
        .concat(outputPath)
        .on('error', (err) => new Error(err))
        .on('end', () => outputPath);
};
//# sourceMappingURL=audio.js.map