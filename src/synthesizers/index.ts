import appRootPath from 'app-root-path';
// import { awsSsmlPartsToSpeech } from './aws';
import { Article } from 'database/entities/article';
import { Audiofile, AudiofileEncoding } from 'database/entities/audiofile';
import * as storage from '../storage/google-cloud';
import { concatAudioFiles, getAudioFileDurationInSeconds } from '../utils/audio';
import { getSSMLParts } from '../utils/ssml';
import { googleSsmlPartsToSpeech } from './google';
import fsExtra from 'fs-extra';

export type SynthesizerOptions = {
  synthesizer: string,
  languageCode: string,
  name: string,
  encoding: AudiofileEncoding
};

/* eslint-disable no-console */

/**
 * Takes the article and prepared audiofile object to synthesize the SSML to Speech.
 * It will return an audiofile object ready to be saved in the database.
 */
export const synthesizeArticleToAudiofile = async (article: Article, audiofile: Audiofile, encoding: SynthesizerOptions['encoding']): Promise<Audiofile> => {
  const hrstart = process.hrtime();

  const articleId = article.id;
  const ssml = article.ssml;
  const audiofileId = audiofile.id;
  const storageUploadPath = `${articleId}/${audiofileId}`;

  if (!articleId || typeof articleId !== 'string') throw new Error('articleId (string) is not given to synthesizeArticleToAudiofile.');
  if (!ssml) throw new Error('ssml (string) is not given to synthesizeArticleToAudiofile.');
  if (!audiofileId) throw new Error('audiofileId (string) is not given to synthesizeArticleToAudiofile.');

  const synthesizerOptions: SynthesizerOptions = {
    encoding,
    synthesizer: 'Google', // or Amazon
    languageCode: 'en-US', // or en-GB, en-AU
    name: 'en-US-Wavenet-D' // or en-GB-Wavenet-A or en-GB-Standard-D (British) cheaper)
  };

  // Step 1: Split the SSML into chunks the synthesizer allows
  const ssmlParts = getSSMLParts(ssml);

  // Step 2: Send the SSML parts to Google's Text to Speech API and download the audio files
  const localAudiofilePaths = await googleSsmlPartsToSpeech(
    ssmlParts,
    article,
    audiofile,
    synthesizerOptions,
    storageUploadPath
  );

  // Step 3: Combine multiple audiofiles into one
  const concatinatedLocalAudiofilePath = await concatAudioFiles(
    localAudiofilePaths,
    storageUploadPath,
    synthesizerOptions.encoding
  );

  // Step 4: Get the length of the audiofile
  const audiofileLength = await getAudioFileDurationInSeconds(concatinatedLocalAudiofilePath);

  // Step 5: Upload the one mp3 file to Google Cloud Storage
  const uploadResponse = await storage.uploadFile(
    concatinatedLocalAudiofilePath,
    storageUploadPath,
    synthesizerOptions,
    article,
    audiofile.id,
    audiofileLength
  );

  // Step 6: Delete the local file, we don't need it anymore
  await fsExtra.remove(`${appRootPath}/temp/${articleId}`);

  // Step 7: Create a publicfile URL our users can use
  const publicFileUrl = storage.getPublicFileUrl(uploadResponse);

  // Step 8: Return the audiofile properties needed for database insertion
  audiofile.url = publicFileUrl;
  audiofile.bucket = uploadResponse[0].bucket.name;
  audiofile.filename = uploadResponse[0].name;
  audiofile.length = audiofileLength;
  audiofile.languageCode = synthesizerOptions.languageCode;
  audiofile.encoding = synthesizerOptions.encoding;
  audiofile.voice = synthesizerOptions.name;
  audiofile.synthesizer = synthesizerOptions.synthesizer;

  const hrend = process.hrtime(hrstart);
  console.info('Execution time (hr) of synthesizeArticleToAudiofile(): %ds %dms', hrend[0], hrend[1] / 1000000);

  // Return the audiofile with the correct properties, so it can be saved in the database
  return audiofile;
};
