import appRootPath from 'app-root-path';
import fsExtra from 'fs-extra';

import { Voice, Synthesizer } from '../database/entities/voice';
import { Article } from '../database/entities/article';
import { Audiofile, AudiofileMimeType } from '../database/entities/audiofile';

import * as storage from '../storage/google-cloud';

import { concatAudioFiles, getAudioFileDurationInSeconds } from '../utils/audio';
import { getSSMLParts, AWS_CHARACTER_LIMIT } from '../utils/ssml';

import { googleSsmlPartsToSpeech, GoogleSynthesizerOptions, GoogleAudioEncodingType } from './google';
import { awsSsmlPartsToSpeech, AWSSynthesizerOptions } from './aws';
import { Polly } from 'aws-sdk';

/* eslint-disable no-console */

export type SynthesizerType = 'article' | 'preview';
export type SynthesizerAudioEncodingTypes = GoogleAudioEncodingType & Polly.OutputFormat;

export enum SynthesizerEncoding {
  GOOGLE_MP3 = 'MP3',
  GOOGLE_OGG_OPUS = 'OGG_OPUS',
  GOOGLE_LINEAR16 = 'LINEAR16',
  AWS_MP3 = 'mp3',
  AWS_PCM = 'pcm',
  AWS_OGG_VORBIS = 'ogg_vorbis'
}

/**
 * Converts the given mimeType to the correct encoding parameter for the synthesizer service to use.
 *
 * For example: when someone requests an article text to be synthesized into a "audio/mpeg" file, the synthesizer will use the parameter:
 * { "audioConfig": { "audioEncoding": "MP3" } } (Google)
 * or
 * { "OutputFormat": "mp3" } (AWS)
 *
 */
export const mimeTypeToEncoderParameter = (mimeType: AudiofileMimeType, synthesizer: Synthesizer) => {
  if (mimeType === 'audio/mpeg') {
    return (synthesizer === Synthesizer.GOOGLE) ? SynthesizerEncoding.GOOGLE_MP3 : SynthesizerEncoding.AWS_MP3;
  }

  if (mimeType === 'audio/wav') {
    return (synthesizer === Synthesizer.GOOGLE) ? SynthesizerEncoding.GOOGLE_MP3 : null;
  }

  if (mimeType === 'audio/pcm') {
    return (synthesizer === Synthesizer.GOOGLE) ? null : SynthesizerEncoding.AWS_PCM;
  }

  if (mimeType === 'audio/ogg') {
    return (synthesizer === Synthesizer.GOOGLE) ? null : SynthesizerEncoding.AWS_OGG_VORBIS;
  }

  if (mimeType === 'audio/opus') {
    return (synthesizer === Synthesizer.GOOGLE) ? SynthesizerEncoding.GOOGLE_OGG_OPUS : null;
  }
};

/**
 * Takes the article and prepared audiofile object to synthesize the SSML to Speech.
 * It will return an audiofile object ready to be saved in the database.
 */
export const synthesizeArticleToAudiofile = async (voice: Voice, article: Article, audiofile: Audiofile, mimeType: AudiofileMimeType): Promise<Audiofile> => {
  const hrstart = process.hrtime();

  let createdAudiofile: Audiofile = null;

  const articleId = article.id;
  const ssml = article.ssml;
  const audiofileId = audiofile.id;
  const storageUploadPath = `${articleId}/audiofiles/${audiofileId}`;
  const encodingParameter = mimeTypeToEncoderParameter(mimeType, voice.synthesizer);

  if (!encodingParameter) throw new Error(`${voice.synthesizer} does not support ${mimeType}.`);
  if (!articleId || typeof articleId !== 'string') throw new Error('articleId (string) is not given to synthesizeArticleToAudiofile.');
  if (!ssml) throw new Error('ssml (string) is not given to synthesizeArticleToAudiofile.');
  if (!audiofileId) throw new Error('audiofileId (string) is not given to synthesizeArticleToAudiofile.');

  if (voice.synthesizer === 'Google') {
    createdAudiofile = await synthesizeUsingGoogle(ssml, voice, article, audiofile, mimeType, encodingParameter, storageUploadPath);
  } else if (voice.synthesizer === 'AWS') {
    createdAudiofile = await synthesizeUsingAWS(ssml, voice, article, audiofile, mimeType, encodingParameter, storageUploadPath);
  } else {
    throw new Error('Synthesizer not supported. Please use Google or AWS.');
  }

  const hrend = process.hrtime(hrstart);
  console.info('Execution time (hr) of synthesizeArticleToAudiofile(): %ds %dms', hrend[0], hrend[1] / 1000000);

  // Return the audiofile with the correct properties, so it can be saved in the database
  return createdAudiofile;
};

const synthesizeUsingAWS = async (
  ssml: string,
  voice: Voice,
  article: Article,
  audiofile: Audiofile,
  mimeType: AudiofileMimeType,
  encodingParameter: SynthesizerEncoding,
  storageUploadPath: string
) => {
  // Step 1: Split the SSML into chunks the synthesizer allows
  const ssmlParts = getSSMLParts(ssml, {
    softLimit: AWS_CHARACTER_LIMIT - 1000,
    hardLimit: AWS_CHARACTER_LIMIT
  });

  const synthesizerOptions: AWSSynthesizerOptions = {
    OutputFormat: encodingParameter,
    VoiceId: voice.name,
    LanguageCode: voice.languageCode,
    TextType: 'ssml',
    Text: ''  // We fill this later
  };

  // Step 2: Send the SSML parts to Google's Text to Speech API and download the audio files
  const localAudiofilePaths = await awsSsmlPartsToSpeech(
    ssmlParts,
    'article',
    article.id,
    synthesizerOptions,
    storageUploadPath
  );

  // Step 3: Combine multiple audiofiles into one
  const concatinatedLocalAudiofilePath = await concatAudioFiles(
    localAudiofilePaths,
    storageUploadPath,
    encodingParameter
  );

  // Step 4: Get the length of the audiofile
  const audiofileLength = await getAudioFileDurationInSeconds(concatinatedLocalAudiofilePath);

  // Step 5: Upload the one mp3 file to Google Cloud Storage
  const uploadResponse = await storage.uploadArticleAudioFile(
    voice,
    concatinatedLocalAudiofilePath,
    storageUploadPath,
    mimeType,
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

  return audiofile;
};

const synthesizeUsingGoogle = async (
  ssml: string,
  voice: Voice,
  article: Article,
  audiofile: Audiofile,
  mimeType: AudiofileMimeType,
  encodingParameter: SynthesizerEncoding,
  storageUploadPath: string
) => {
  // Step 1: Split the SSML into chunks the synthesizer allows
  const ssmlParts = getSSMLParts(ssml);

  const synthesizerOptions: GoogleSynthesizerOptions = {
    audioConfig: {
      audioEncoding: encodingParameter
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
    'article',
    article.id,
    synthesizerOptions,
    storageUploadPath
  );

  // Step 3: Combine multiple audiofiles into one
  const concatinatedLocalAudiofilePath = await concatAudioFiles(
    localAudiofilePaths,
    storageUploadPath,
    encodingParameter
  );

  // Step 4: Get the length of the audiofile
  const audiofileLength = await getAudioFileDurationInSeconds(concatinatedLocalAudiofilePath);

  // Step 5: Upload the one mp3 file to Google Cloud Storage
  const uploadResponse = await storage.uploadArticleAudioFile(
    voice,
    concatinatedLocalAudiofilePath,
    storageUploadPath,
    mimeType,
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

  return audiofile;
};
