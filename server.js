const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const { asyncMiddleware } = require('./utils/async-middleware');
const { getAudioFile, getAudioFileDurationInSeconds } = require('./audiofiles');
const path = require('path');
global.appRoot = path.resolve(__dirname);

app.get('/audiofile/:mediumPostId', asyncMiddleware(async (req, res, next) => {
    const { mediumPostId } = req.params;

    // Steps:
    // 1. see if we already have an audio file for this ID
    // If we have: return that file
    // If not: generate one
    const audioFilePath = await getAudioFile(mediumPostId);

    if (!audioFilePath) {
        res.json({message: 'Audiofile needs to be generated.'})

    } else {
        const audioFileDurationInSeconds = await getAudioFileDurationInSeconds(audioFilePath)
        res.json({ audioFilePath, audioFileDurationInSeconds })
    }

}))

app.listen(PORT, () => console.log(`App listening on port ${PORT}!`))