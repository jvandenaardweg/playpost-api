require('dotenv').config()

const fs = require('fs');
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

const toSpeech = (id, text, part) => {
    return new Promise((resolve, reject) => {

        const path = `storage/audio/medium.com/${id}-${part}.mp3`

        const request = {
            input: {text: text},
            // Select the language and SSML Voice Gender (optional)
            voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
            // Select the type of audio encoding
            audioConfig: {audioEncoding: 'MP3'},
        };

        // Performs the Text-to-Speech request
        client.synthesizeSpeech(request, (err, response) => {
            if (err) {
                // console.error('ERROR:', err);
                return reject(err);
                // return;
            }

            // Write the binary audio content to a local file
            fs.writeFile(path, response.audioContent, 'binary', err => {
                if (err) {
                    // console.error('ERROR:', err);
                    return reject(err);
                    // return;
                }
                console.log(`Audio content written to file: ${path}`);
                return resolve(path)
            });
        });
    })

}


module.exports = { toSpeech }