const audioconcat = require('audioconcat');
const fs = require('fs-extra');
const mp3Duration = require('mp3-duration');

/* eslint-disable no-console */

const getAudioFileDurationInSeconds = async (audioFilePath) => {
  console.log('Get audiofile duration in seconds...');

  return new Promise((resolve, reject) => {
    mp3Duration(audioFilePath, (err, durationInSeconds) => {
      if (err) return reject(err);

      console.log(`Got audiofile duration: ${durationInSeconds} seconds.`);
      return resolve(durationInSeconds);
    });
  });
};

const concatAudioFiles = (mediumPostId, audioFiles, synthesizerOptions) => {
  return new Promise((resolve, reject) => {
    if (!audioFiles.length) reject(new Error('No audiofiles given to concat.'));

    // If we have just one file, we don't need to concat it
    // We just remove the index number and return the file
    if (audioFiles.length === 1) {
      const audioFile = audioFiles[0];
      const audioFileNameWithoutIndex = audioFile.split('-0.mp3')[0];
      const newAudiofileName = `${audioFileNameWithoutIndex}.mp3`;

      return fs.copy(audioFile, newAudiofileName)
        .then(() => resolve(newAudiofileName))
        .catch(err => reject(err));
    }

    // If we have multiple audiofiles, we concat them
    // First, sort correctly
    audioFiles.sort((a, b) => b - a); // Sort: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 etc...

    audioFiles.forEach(audioFile => console.log(`Sorted audiofiles, order: ${audioFile}`));

    console.log(`Combining ${audioFiles.length} audio files to one audio file...`);

    const outputPath = `${global.appRoot}/temp/${synthesizerOptions.source}/${mediumPostId}/${mediumPostId}.mp3`;

    return audioconcat(audioFiles)
      .concat(outputPath)
      .on('error', err => reject(err))
      .on('end', () => resolve(outputPath));
  });
};

module.exports = { concatAudioFiles, getAudioFileDurationInSeconds }
