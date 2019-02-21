const { getMediumPostById, getMediumPostIdFromUrl } = require('./fetcher');
const { ssmlPartsToSpeech } = require('./synthesize');
const { splitSSML } = require('./utils/split');
const { concatAudioFiles } = require('./utils/concat-audio-files');
const { removeFiles } = require('./utils/cleanup');
const { getAudioFileDurationInSeconds } = require('./audiofiles');
const { uploadFile } = require('./storage');
const path = require('path');

global.appRoot = path.resolve(__dirname); // TODO: try not to use global vars

(async () => {
  try {
    const url = 'https://medium.freecodecamp.org/learn-typescript-in-5-minutes-13eda868daeb';

    const mediumPostId = getMediumPostIdFromUrl(url);

    // TODO:
    // Detect if medium post is already in db
    // Detect if audio file already exist

    // 1. Get content
    console.log(`1. Getting the medium post by id "${mediumPostId}"...`);
    const { ssml, title } = await getMediumPostById(mediumPostId);

    console.log(`2. Got medium post "${title}"`);

    // 2. Split content, so we don't reach the maximum characters per file
    console.log('3. Splitting up the content...');
    const ssmlParts = await splitSSML(ssml);

    console.log(`4. Got ${ssmlParts.length} SSML parts.`);

    // 3. Convert content to audio files
    console.log(
      `5. Converting the ${ssmlParts.length} SSML parts to audio files...`,
    );
    const fileNames = await ssmlPartsToSpeech(mediumPostId, ssmlParts);

    console.log(`6. Got ${fileNames.length} audio files.`);

    // 4. Combine audio files
    const audioFilePath = await concatAudioFiles(mediumPostId, fileNames);

    // 5. Get audio duration of concatinated audio files
    const audioFileDurationInSeconds = await getAudioFileDurationInSeconds(
      audioFilePath,
    );

    // 5. Upload to external storage
    const uploadedFile = await uploadFile(audioFilePath);

    // 6. Delete audio files
    // const filesToRemove = [...fileNames, audioFile];
    // console.log(`9. Cleanup ${filesToRemove.length} left over files we don't need anymore.`);
    // const removedFile = await removeFiles(filesToRemove)

    // console.log(`10. Removed ${removedFiles.length} files: ${removedFile}`)

    // 7. Present download/stream URL to user
  } catch (err) {
    console.log(err);
  }
})();

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});
