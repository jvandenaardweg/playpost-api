
const synthesize = require('../synthesizers/google');
const dataSource = require('../data-sources/medium');
const utils = require('../utils');
const storage = require('../storage/google-cloud');

const getAudiofile = async (req, res) => {
  const { url } = req.query;

  if (!url || url === '') return res.status(400).json({ message: 'Please give a URL param.' });

  const normalizedUrl = url.toLowerCase();

  // if (!normalizedUrl.includes('medium.com')) return res.status(400).json({ message: 'We only allow Medium URLs for now.' });

  // Get the Medium Post ID from the URL
  // If the URL is incorrect, we error
  const articleId = await dataSource.getArticleIdFromUrl(normalizedUrl);

  // So in the future we can determine what voice a user wants to use
  // For example: "free" user maybe should use Amazon, because it's cheaper
  // For example: "premium" user maybe should use Google, because it's more expensive
  const synthesizerOptions = {
    synthesizer: 'Google', // or Amazon
    languageCode: 'en-US', // or en-GB, en-AU
    name: 'en-US-Wavenet-D', // or en-GB-Wavenet-A
    source: 'medium-com' // or cnn-com
  };

  // Create an upload path based on the synthesizer options
  // We end up with something like this: google/en-us/en-us-wavenet-d/medium-com
  const uploadPath = Object.values(synthesizerOptions)
    .map(value => value.toLowerCase())
    .join('/');

  // Find an existing file in our cloud storage
  const existingFiles = await storage.listFilesByPrefix(`${uploadPath}/`);
  const foundFile = existingFiles && existingFiles.length
    ? existingFiles.find(file => file.name.includes(articleId))
    : null;

  // If we already have a file in storage, we just return that (for now)
  // TODO: we should not use the cloud storage API for this? use a database?
  // so we an also return information about the article?
  if (foundFile) {
    return res.json({ publicFileUrl: storage.getPublicFileUrl(foundFile.metadata), article: {} });
  }

  // If we don't have an audiofile, we go into here

  // Get the SSML data for speech processing
  const { ssml, ...article } = await dataSource.getArticleById(articleId);

  // Split the SSML data in parts so we don't reach the character limit (5000)
  const ssmlParts = await utils.ssml.getSSMLParts(ssml);

  // Send the SSML parts to Google's Text to Speech API and download the audio files
  const localAudiofilePaths = await synthesize.ssmlPartsToSpeech(
    articleId,
    ssmlParts,
    synthesizerOptions,
  );

  // Uncomment for local dev testing purposes
  // const localAudiofilePaths = [
  //     '/Users/jordy/Projects/medium-audio/temp/medium-com/13eda868daeb/13eda868daeb-0.mp3',
  //     '/Users/jordy/Projects/medium-audio/temp/medium-com/13eda868daeb/13eda868daeb-1.mp3',
  //     '/Users/jordy/Projects/medium-audio/temp/medium-com/13eda868daeb/13eda868daeb-2.mp3',
  // ]

  // Concatinate the different files into one .mp3 file
  const concatinatedLocalAudiofilePath = await utils.audio.concatAudioFiles(
    articleId,
    localAudiofilePaths,
    synthesizerOptions,
  );

  // const audioFileDurationInSeconds = await utils.audio.getAudioFileDurationInSeconds(concatinatedLocalAudiofilePath);

  // Upload the one mp3 file to Google Cloud Storage
  const publicFileUrl = await storage.uploadFile(
    concatinatedLocalAudiofilePath,
    uploadPath,
    synthesizerOptions
  );

  // TODO: Store all this data in a database

  // Cleanup the local audiofiles, we don't need that anymore
  await utils.local.removeFile(
    `${global.appRoot}/temp/${synthesizerOptions.source}/${articleId}`,
  );

  console.log('Done!');

  return res.json({ publicFileUrl, article });
};

module.exports = {
  getAudiofile
};
