const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const { asyncMiddleware } = require('./utils/async-middleware');

const synthesize = require('./synthesizers/google');
const dataSource = require('./data-sources/medium');
const utils = require('./utils');
const storage = require('./storage/google-cloud');

global.appRoot = path.resolve(__dirname);

app.get('/audiofile', asyncMiddleware(async (req, res, next) => {
    const { url } = req.query;

    // Get the Medium Post ID from the URL
    // If the URL is incorrect, we error
    const articleId = await dataSource.getArticleIdFromUrl(url);

    // TODO: get article and audiofile URL from a database

    // Get the SSML data for speech processing
    const { ssml, ...article } = await dataSource.getArticleById(articleId);

    // Split the SSML data in parts so we don't reach the character limit (5000)
    const ssmlParts = await utils.ssml.getSSMLParts(ssml);

    // Send the SSML parts to Google's Text to Speech API and download the audio files
    const localAudiofilePaths = await synthesize.ssmlPartsToSpeech(articleId, ssmlParts);

    // Uncomment for local dev testing purposes
    // const localAudiofilePaths = [
    //     '/Users/jordy/Projects/medium-audio/audio/medium.com/13eda868daeb/13eda868daeb-0.mp3',
    //     '/Users/jordy/Projects/medium-audio/audio/medium.com/13eda868daeb/13eda868daeb-1.mp3',
    //     '/Users/jordy/Projects/medium-audio/audio/medium.com/13eda868daeb/13eda868daeb-2.mp3',
    // ]

    // Concatinate the different files into one .mp3 file
    const concatinatedLocalAudiofilePath = await utils.audio.concatAudioFiles(articleId, localAudiofilePaths);

    // const audioFileDurationInSeconds = await utils.audio.getAudioFileDurationInSeconds(concatinatedLocalAudiofilePath);

    // Upload the one mp3 file to Google Cloud Storage
    const publicFileUrl = await storage.uploadFile(concatinatedLocalAudiofilePath);

    // TODO: Store all this data in a database

    // Cleanup the local audiofiles, we don't need that anymore
    const removedFile = await utils.local.removeFile(global.appRoot + `/audio/medium.com/${articleId}`)

    console.log('Done!');

    res.json({ publicFileUrl, article });
}))

app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));