require('dotenv').config()

const fs = require('fs-extra');
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

const AVAILABLE_VOICES = {
    'en': {
        languageCode: 'en-US',
        name: 'en-US-Wavenet-D' // Good sounding male voice
        // name: 'en-US-Wavenet-F' // Good sounding female voice
    }
};

const ssmlPartsToSpeech = (id, ssmlParts) => {
    let promises = []

    ssmlParts.forEach((ssmlPart, index) => promises.push(ssmlToSpeech(id, ssmlPart, index)))

    return Promise.all(promises);

}
const ssmlToSpeech = (mediumPostId, ssmlPart, index) => {
    return new Promise((resolve, reject) => {

        const voice = AVAILABLE_VOICES['en']; // TODO: make based on post language

        const audioFilePath = global.appRoot + `/audio/medium.com/${mediumPostId}/${mediumPostId}-${index}.mp3`;

        const request = {
            voice,
            input: {
                ssml: ssmlPart
            },
            audioConfig: {
                audioEncoding: 'MP3'
            }
        };

        console.log(`Synthesizing Medium Post ID '${mediumPostId}' SSML part ${index} to '${voice.languageCode}' speech using '${voice.name}' at: ${audioFilePath}`);

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