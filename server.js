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

    // So in the future we can determine what voice a user wants to use
    // For example: "free" user maybe should use Amazon, because it's cheaper
    // For example: "premium" user maybe should use Google, because it's more expensive
    const synthesizerOptions = {
        synthesizer: 'Google', // or Amazon
        languageCode: 'en-US', // or en-GB, en-AU
        name: 'en-US-Wavenet-D', // or en-GB-Wavenet-A
        source: 'medium-com' // or cnn-com
    };

    const uploadPath = Object.values(synthesizerOptions).map((value) => value.toLowerCase()).join('/');

    // TODO: get article and audiofile URL from a database

    // Get the SSML data for speech processing
    const { ssml, ...article } = await dataSource.getArticleById(articleId);

    // Split the SSML data in parts so we don't reach the character limit (5000)
    const ssmlParts = await utils.ssml.getSSMLParts(ssml);

    // Send the SSML parts to Google's Text to Speech API and download the audio files
    const localAudiofilePaths = await synthesize.ssmlPartsToSpeech(articleId, ssmlParts, synthesizerOptions);

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
    const publicFileUrl = await storage.uploadFile(concatinatedLocalAudiofilePath, uploadPath);

    // TODO: Store all this data in a database

    // Cleanup the local audiofiles, we don't need that anymore
    const removedFile = await utils.local.removeFile(global.appRoot + `/audio/medium.com/${articleId}`)

    console.log('Done!');

    res.json({ publicFileUrl, article });
}))

app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));