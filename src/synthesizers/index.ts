import appRootPath from 'app-root-path';
import fsExtra from 'fs-extra';
import { Voice } from 'database/entities/voice';

import { Article } from '../database/entities/article';
import { Audiofile, AudiofileEncoding } from '../database/entities/audiofile';

import * as storage from '../storage/google-cloud';

import { concatAudioFiles, getAudioFileDurationInSeconds } from '../utils/audio';
import { getSSMLParts } from '../utils/ssml';

import { googleSsmlPartsToSpeech, GoogleSynthesizerOptions } from './google';
import { awsSsmlPartsToSpeech, AWSSynthesizerOptions } from './aws';

/* eslint-disable no-console */

/**
 * Takes the article and prepared audiofile object to synthesize the SSML to Speech.
 * It will return an audiofile object ready to be saved in the database.
 */
export const synthesizeArticleToAudiofile = async (voice: Voice, article: Article, audiofile: Audiofile, encoding: AudiofileEncoding): Promise<Audiofile> => {
  const hrstart = process.hrtime();

  let createdAudiofile: Audiofile = null;

  const articleId = article.id;
  const ssml = article.ssml;
  const audiofileId = audiofile.id;
  const storageUploadPath = `${articleId}/${audiofileId}`;

  if (!articleId || typeof articleId !== 'string') throw new Error('articleId (string) is not given to synthesizeArticleToAudiofile.');
  if (!ssml) throw new Error('ssml (string) is not given to synthesizeArticleToAudiofile.');
  if (!audiofileId) throw new Error('audiofileId (string) is not given to synthesizeArticleToAudiofile.');

  if (voice.synthesizer === 'Google') {
    createdAudiofile = await synthesizeUsingGoogle(ssml, voice, article, audiofile, encoding, storageUploadPath);
  } else if (voice.synthesizer === 'AWS') {
    createdAudiofile = await synthesizeUsingAWS(ssml, voice, article, audiofile, encoding, storageUploadPath);
  } else {
    throw new Error('Synthesizer not supported. Please use Google or AWS.');
  }

  const hrend = process.hrtime(hrstart);
  console.info('Execution time (hr) of synthesizeArticleToAudiofile(): %ds %dms', hrend[0], hrend[1] / 1000000);

  // Return the audiofile with the correct properties, so it can be saved in the database
  return createdAudiofile;
};

const synthesizeUsingAWS = async (ssml: string, voice: Voice, article: Article, audiofile: Audiofile, encoding: AudiofileEncoding, storageUploadPath: string) => {
  // Step 1: Split the SSML into chunks the synthesizer allows
  const ssmlParts = getSSMLParts(ssml);

  const synthesizerOptions: AWSSynthesizerOptions = {
    OutputFormat: encoding.toLowerCase(),
    VoiceId: voice.name,
    LanguageCode: voice.languageCode,
    TextType: 'ssml',
    Text: ''  // We fill this later
  };

  // Step 2: Send the SSML parts to Google's Text to Speech API and download the audio files
  const localAudiofilePaths = await awsSsmlPartsToSpeech(
    ssmlParts,
    article,
    synthesizerOptions,
    storageUploadPath
  );

  // Step 3: Combine multiple audiofiles into one
  const concatinatedLocalAudiofilePath = await concatAudioFiles(
    localAudiofilePaths,
    storageUploadPath,
    encoding
  );

  // Step 4: Get the length of the audiofile
  const audiofileLength = await getAudioFileDurationInSeconds(concatinatedLocalAudiofilePath);

  // Step 5: Upload the one mp3 file to Google Cloud Storage
  const uploadResponse = await storage.uploadFile(
    voice,
    concatinatedLocalAudiofilePath,
    storageUploadPath,
    encoding,
    article,
    audiofile.id,
    audiofileLength
  );

  // Step 6: Delete the local file, we don't need it anymore
  await fsExtra.remove(`${appRootPath}/temp/${article.id}`);

  // Step 7: Create a publicfile URL our users can use
  const publicFileUrl = storage.getPublicFileUrl(uploadResponse);

  // Step 8: Return the audiofile properties needed for database insertion
  audiofile.url = publicFileUrl;
  audiofile.bucket = uploadResponse[0].bucket.name;
  audiofile.filename = uploadResponse[0].name;
  audiofile.length = audiofileLength;
  audiofile.languageCode = synthesizerOptions.LanguageCode;
  audiofile.encoding = encoding;

  return audiofile;
};

const synthesizeUsingGoogle = async (ssml: string, voice: Voice, article: Article, audiofile: Audiofile, encoding: AudiofileEncoding, storageUploadPath: string) => {
  // Step 1: Split the SSML into chunks the synthesizer allows
  const ssmlParts = getSSMLParts(ssml);

  const synthesizerOptions: GoogleSynthesizerOptions = {
    audioConfig: {
      audioEncoding: encoding
    },
    voice: {
      languageCode: voice.languageCode,
      name: voice.name,
      ssmlGender: voice.gender
    },
    input: {
      ssml: '' // We fill this later
    }
  };

  // Step 2: Send the SSML parts to Google's Text to Speech API and download the audio files
  const localAudiofilePaths = await googleSsmlPartsToSpeech(
    ssmlParts,
    article,
    synthesizerOptions,
    storageUploadPath
  );

  // Step 3: Combine multiple audiofiles into one
  const concatinatedLocalAudiofilePath = await concatAudioFiles(
    localAudiofilePaths,
    storageUploadPath,
    encoding
  );

  // Step 4: Get the length of the audiofile
  const audiofileLength = await getAudioFileDurationInSeconds(concatinatedLocalAudiofilePath);

  // Step 5: Upload the one mp3 file to Google Cloud Storage
  const uploadResponse = await storage.uploadFile(
    voice,
    concatinatedLocalAudiofilePath,
    storageUploadPath,
    encoding,
    article,
    audiofile.id,
    audiofileLength
  );

  // Step 6: Delete the local file, we don't need it anymore
  await fsExtra.remove(`${appRootPath}/temp/${article.id}`);

  // Step 7: Create a publicfile URL our users can use
  const publicFileUrl = storage.getPublicFileUrl(uploadResponse);

  // Step 8: Return the audiofile properties needed for database insertion
  audiofile.url = publicFileUrl;
  audiofile.bucket = uploadResponse[0].bucket.name;
  audiofile.filename = uploadResponse[0].name;
  audiofile.length = audiofileLength;
  audiofile.languageCode = synthesizerOptions.voice.languageCode;
  audiofile.encoding = encoding;

  return audiofile;
};
