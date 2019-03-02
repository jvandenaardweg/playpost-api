import appRootPath from 'app-root-path';
// import { awsSsmlPartsToSpeech } from './aws';
import { Article } from 'database/entities/article';
import { Audiofile } from 'database/entities/audiofile';
import * as storage from '../storage/google-cloud';
import { concatAudioFiles, getAudioFileDurationInSeconds } from '../utils/audio';
import { removeFile } from '../utils/local';
import { getSSMLParts } from '../utils/ssml';
import { googleSsmlPartsToSpeech } from './google';

export type SynthesizerOptions = {
  synthesizer: string,
  languageCode: string,
  name: string,
  encoding: string
};

/* eslint-disable no-console */

/**
 * Takes the article and prepared audiofile object to synthesize the SSML to Speech.
 * It will return an audiofile object ready to be saved in the database.
 */
export const synthesizeArticleToAudiofile = async (article: Article, audiofile: Audiofile): Promise<Audiofile> => {
  const articleId = article.id;
  const ssml = article.ssml;
  const audiofileId = audiofile.id;
  const storageUploadPath = `${articleId}/${audiofileId}`;

  if (!articleId || typeof articleId !== 'string') throw new Error('articleId (string) is not given to synthesizeArticleToAudiofile.');
  if (!ssml) throw new Error('ssml (string) is not given to synthesizeArticleToAudiofile.');
  if (!audiofileId) throw new Error('audiofileId (string) is not given to synthesizeArticleToAudiofile.');

  const synthesizerOptions: SynthesizerOptions = {
    synthesizer: 'Google', // or Amazon
    languageCode: 'en-US', // or en-GB, en-AU
    name: 'en-US-Wavenet-D', // or en-GB-Wavenet-A
    encoding: 'mp3'
  };

  const ssmlParts = getSSMLParts(ssml);

  // Send the SSML parts to Google's Text to Speech API and download the audio files
  const localAudiofilePaths = await googleSsmlPartsToSpeech(
    ssmlParts,
    article,
    audiofile,
    synthesizerOptions,
    storageUploadPath
  );

  // Combine multiple audiofiles into one
  const concatinatedLocalAudiofilePath = await concatAudioFiles(
    localAudiofilePaths,
    storageUploadPath
  );

  // Get the length of the audiofile
  const audiofileLengthInSeconds = await getAudioFileDurationInSeconds(concatinatedLocalAudiofilePath);

  // Upload the one mp3 file to Google Cloud Storage
  const uploadResponse = await storage.uploadFile(
    concatinatedLocalAudiofilePath,
    storageUploadPath,
    synthesizerOptions,
    article,
    audiofile,
    audiofileLengthInSeconds
  );

  // Delete the local file, we don't need it anymore
  await removeFile(`${appRootPath}/temp/${articleId}`);

  // Create a publicfile URL our users can use
  const publicFileUrl = storage.getPublicFileUrl(uploadResponse);

  audiofile.url = publicFileUrl;
  audiofile.bucket = uploadResponse[0].bucket.name;
  audiofile.filename = uploadResponse[0].name;
  audiofile.lengthInSeconds = audiofileLengthInSeconds;
  audiofile.languageCode = synthesizerOptions.languageCode;
  audiofile.encoding = synthesizerOptions.encoding;
  audiofile.voice = synthesizerOptions.name;
  audiofile.synthesizer = synthesizerOptions.synthesizer;

  // Return the audiofile with the correct properties, so it can be saved in the database
  return audiofile;
};

// export const ssmlPartsToSpeech = (articleId: string, ssmlParts: string[], synthesizerOptions: SynthesizerOptions, storageUploadPath: string): Promise<string[]> => {
//   const { synthesizer } = synthesizerOptions;
//   const availableSynthesizers = ['Google', 'AWS'];

//   if (!articleId || typeof articleId !== 'string') throw new Error('articleId (string) is not given to ssmlPartsToSpeech.');
//   if (!ssmlParts || !ssmlParts.length) throw new Error('ssmlParts (array) is not given to ssmlPartsToSpeech.');
//   if (!synthesizerOptions) throw new Error('synthesizerOptions is not given to ssmlPartsToSpeech.');
//   if (!storageUploadPath) throw new Error('storageUploadPath is not given to ssmlPartsToSpeech.');

//   if (!availableSynthesizers.includes(synthesizer)) {
//     throw new Error(`Synthesizer option ${synthesizer} is not available. Please use: ${availableSynthesizers.join(' or ')}`);
//   }

//   console.log(`Using synthesizer "${synthesizer}".`);

//   const ssmlParts = utils.ssml.getSSMLParts(ssml);

//   // Send the SSML parts to Google's Text to Speech API and download the audio files
//   const localAudiofilePaths = await ssmlPartsToSpeech(
//     articleId,
//     ssmlParts,
//     synthesizerOptions,
//     storageUploadPath
//   );

//   if (synthesizer === 'Google') {
//     return googleSsmlPartsToSpeech(articleId, ssmlParts, synthesizerOptions, storageUploadPath);
//   }

//   return awsSsmlPartsToSpeech(articleId, ssmlParts, synthesizerOptions, storageUploadPath);
// };
