/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

exports.ssmlToSpeech = async (req, res) => {
    const { ssml } = req.query;

    const audioFilePath = await ssmlToSpeech('abc', ssml, 0);

    res.status(200).send(message);
};

const ssmlToSpeech = async (mediumPostId, ssmlPart, index) => {

    try {
        const voice = AVAILABLE_VOICES['en']; // TODO: make based on post language
        // const audioFilePath = global.appRoot + `/audio/medium.com/${mediumPostId}/${mediumPostId}-${index}.mp3`;

        const request = {
            voice,
            input: {
                ssml: ssmlPart
            },
            audioConfig: {
                audioEncoding: 'MP3'
            }
        };

        console.log(`Synthesizing Medium Post ID '${mediumPostId}' SSML part ${index} to '${voice.languageCode}' speech using '${voice.name}'.`);

        // Make sure the path exists, if not, we create it
        // fs.ensureFileSync(audioFilePath);

        // Performs the Text-to-Speech request
        const [response] = await client.synthesizeSpeech(request);

        // Upload the file to our bucket
        const uploadedFile = await uploadToBucket(response.audioContent);

        const publicFileUrl = getPublicFileUrl(uploadedFile);

        return publicFileUrl;
    }
}

const uploadToBucket = async (bucketName) => {

    console.log(`Uploading file "${filePath}" to Google Cloud Storage bucket "${BUCKET_NAME}" in directory "${DIRECTORY_NAME}"...`);
      
    try {
        const filename = path.basename(filePath);
        const destination = `${DIRECTORY_NAME}/${filename}`;

        // Uploads a local file to the bucket
        // https://www.googleapis.com/storage/v1/b/synthesized-audio-files/o/13eda868daeb.mp3
        const uploadedFile = await storage.bucket(BUCKET_NAME).upload(filePath, {
        destination,
        gzip: true,
        metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
            contentType: 'audio/mpeg',
            metadata: {
              source: 'Google Text-to-Speech'
            }
        }
        });

        const publicFileUrl = getPublicFileUrl(uploadedFile);
        console.log(`Uploaded file: ${publicFileUrl}`);
        return publicFileUrl;
    } catch (err) {
        return new Error(err)
    }
}
