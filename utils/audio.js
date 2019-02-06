const audioconcat = require('audioconcat');
const fs = require('fs-extra');
const mp3Duration = require('mp3-duration');

const getAudioFileDurationInSeconds = async (audioFilePath) => {
  console.log('Get audiofile duration in seconds...')
  return new Promise((resolve, reject) => {
      mp3Duration(audioFilePath, (err, durationInSeconds) => {
          if (err) return reject(err);
          console.log(`Got audiofile duration: ${durationInSeconds} seconds.`)
          return resolve(durationInSeconds);
        });
  });
}

const concatAudioFiles = (mediumPostId, audioFiles, synthesizerOptions) => {
  return new Promise((resolve, reject) => {
    if (audioFiles.length > 1) {
      const sortedAudioFiles = audioFiles.sort()

      audioFiles.forEach((audioFile) => console.log(`Sorted audiofiles, order: ${audioFile}`))

      console.log(`Combining ${audioFiles.length} audio files to one audio file...`);

      const outputPath = global.appRoot + `/audio/${synthesizerOptions.source}/${mediumPostId}/${mediumPostId}.mp3`;
      return audioconcat(audioFiles)
        .concat(outputPath)
        // .on('start', function (command) {
        //   console.log('ffmpeg process started:', command)
        // })
        .on('error', function (err, stdout, stderr) {
          // console.error('Error:', err)
          // console.error('ffmpeg stderr:', stderr)
          return reject(err)
        })
        .on('end', function (output) {
          // console.error('Audio created in:', output)
          return resolve(outputPath)
        })
    } else {
      console.log(`We just got one file, we rename it.`);
      // If we just have one file, we just rename it
      const audioFile = audioFiles[0];
      const audioFileWithoutIndex = audioFiles[0].split('-0.mp3')[0] + '.mp3';

      return fs.copy(audioFile, audioFileWithoutIndex)
        .then(() => resolve(audioFileWithoutIndex))
        .catch(err => reject(err))
    }
  })
}

module.exports = { concatAudioFiles, getAudioFileDurationInSeconds }