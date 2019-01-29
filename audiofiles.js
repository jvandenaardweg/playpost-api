const fs = require('fs-extra');
const mp3Duration = require('mp3-duration');

const getAudioFile = async (mediumPostId) => {
    const pathToCheck = global.appRoot + `/storage/audio/medium.com/${mediumPostId}.mp3`;

    try {
        const exists = await fs.pathExists(pathToCheck);
        if (!exists) return false;
        return pathToCheck;
    } catch (err) {
        return new Error(err);
    }
}

const getAudioFileDurationInSeconds = async (audioFilePath) => {
    return new Promise((resolve, reject) => {
        mp3Duration(audioFilePath, (err, durationInSeconds) => {
            if (err) return reject(err);
            return resolve(durationInSeconds);
          });
    });
}

module.exports = { getAudioFile, getAudioFileDurationInSeconds }