require('dotenv').config()
const fs = require('fs-extra');
const textToSpeech = require('@google-cloud/text-to-speech');

const { getGoogleCloudCredentials } = require('../utils/credentials');
const client = new textToSpeech.TextToSpeechClient(getGoogleCloudCredentials());

// const AVAILABLE_VOICES = {
//     'en': {
//         languageCode: 'en-US',
//         name: 'en-US-Wavenet-D' // Good sounding male voice
//         // name: 'en-US-Wavenet-F' // Good sounding female voice
//     }
// };

exports.ssmlToAudio = async (req, res) => {
    const { mediumPostId, ssml, index } = req.query;
    const audioFilePath = await ssmlToSpeech(mediumPostId, ssml, index);
    res.json();
}

const ssmlPartsToSpeech = (id, ssmlParts, synthesizerOptions) => {
    let promises = []

    ssmlParts.forEach((ssmlPart, index) => promises.push(ssmlToSpeech(id, ssmlPart, index, synthesizerOptions)))

    return Promise.all(promises);

}
const ssmlToSpeech = (mediumPostId, ssmlPart, index, synthesizerOptions) => {
    return new Promise((resolve, reject) => {

        const audioFilePath = global.appRoot + `/temp/${synthesizerOptions.source}/${mediumPostId}/${mediumPostId}-${index}.mp3`;

        const request = {
            voice: {
                languageCode: synthesizerOptions.languageCode, // TODO: make based on post language
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
        fs.ensureFileSync(audioFilePath);

        // Performs the Text-to-Speech request
        client.synthesizeSpeech(request, (err, response) => {
            if (err) return reject(new Error(err));

            // Write the binary audio content to a local file
            fs.writeFile(audioFilePath, response.audioContent, 'binary', err => {
                if (err) return reject(new Error(err));

                console.log(`Received synthesized audio file for Medium Post ID '${mediumPostId}' SSML part ${index}: ${audioFilePath}`);
                return resolve(audioFilePath)
            });
        });
    });
}


module.exports = { ssmlPartsToSpeech }