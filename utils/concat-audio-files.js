const audioconcat = require('audioconcat');
const fs = require('fs-extra');

const concatAudioFiles = (id, audioFiles) => {
  return new Promise((resolve, reject) => {
    if (audioFiles.length > 1) {
      const outputPath = global.appRoot + `/storage/audio/medium.com/${id}.mp3`;
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
      // If we just have one file, we just rename it
      const audioFile = audioFiles[0];
      const audioFileWithoutIndex = audioFiles[0].split('-0.mp3')[0] + '.mp3';

      return fs.copy(audioFile, audioFileWithoutIndex)
        .then(() => resolve(audioFileWithoutIndex))
        .catch(err => reject(err))
    }
  })
}

module.exports = { concatAudioFiles }