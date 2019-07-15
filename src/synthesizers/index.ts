import appRootPath from 'app-root-path';
import fsExtra from 'fs-extra';

import { Article } from '../database/entities/article';
import { Audiofile, AudiofileMimeType } from '../database/entities/audiofile';
import { Synthesizer, Voice } from '../database/entities/voice';

import * as storage from '../storage/google-cloud';

import { concatAudioFiles, getAudioFileDurationInSeconds } from '../utils/audio';
import { AWS_CHARACTER_HARD_LIMIT, AWS_CHARACTER_SOFT_LIMIT, getSSMLParts, GOOGLE_CHARACTER_HARD_LIMIT, GOOGLE_CHARACTER_SOFT_LIMIT } from '../utils/ssml';

import AWS, { Polly } from 'aws-sdk';
import { logger } from '../utils';
import { awsSSMLPartsToSpeech } from './aws';
import { GoogleAudioEncodingType, googleSSMLPartsToSpeech, IGoogleSynthesizerOptions } from './google';

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

AWS.config.update({ region: process.env.AWS_REGION });

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

  return null;
};

/**
 * Takes the article and prepared audiofile object to synthesize the SSML to Speech.
 * It will return an audiofile object ready to be saved in the database.
 */
export const synthesizeArticleToAudiofile = async (voice: Voice, article: Article, audiofile: Audiofile, mimeType: AudiofileMimeType): Promise<Audiofile> => {
  const hrstart = process.hrtime();
  const loggerPrefix = 'Synthesize Article To Audiofile:';

  logger.info(loggerPrefix, 'Starting...');

  let createdAudiofile: Audiofile;

  const articleId = article.id;
  const ssml = article.ssml;
  const audiofileId = audiofile.id;
  const storageUploadPath = `${articleId}/audiofiles/${audiofileId}`;
  const encodingParameter = mimeTypeToEncoderParameter(mimeType, voice.synthesizer);

  if (!encodingParameter) {
    const errorMessage = `Synthesizer "${voice.synthesizer}" does not support mimeType: ${mimeType}`;
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  if (!ssml) {
    const errorMessage = 'Synthesizer dit not get any SSML to synthesize.';
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  if (voice.synthesizer === 'Google') {
    logger.info(loggerPrefix, 'Starting Google Synthesizing...');
    createdAudiofile = await synthesizeUsingGoogle(ssml, voice, article, audiofile, mimeType, encodingParameter, storageUploadPath);
    logger.info(loggerPrefix, 'Finished Google Synthesizing.');
  } else if (voice.synthesizer === 'AWS') {
    logger.info(loggerPrefix, 'Starting AWS Polly Synthesizing...');
    createdAudiofile = await synthesizeUsingAWS(ssml, voice, article, audiofile, mimeType, encodingParameter, storageUploadPath);
    logger.info(loggerPrefix, 'Finished AWS Polly Synthesizing.');
  } else {
    const errorMessage = 'Synthesizer not supported. Please use Google or AWS.';
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  const hrend = process.hrtime(hrstart);
  logger.info(loggerPrefix, 'Execution time:', hrend[0], hrend[1] / 1000000);

  logger.info(loggerPrefix, 'Ended. Returning the created audiofile.');

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
  const loggerPrefix = 'Synthesize Using AWS:';

  logger.info(loggerPrefix, 'Starting...');

  // Step 1: Split the SSML into chunks the synthesizer allows
  const ssmlParts = getSSMLParts(ssml, {
    softLimit: AWS_CHARACTER_SOFT_LIMIT,
    hardLimit: AWS_CHARACTER_HARD_LIMIT
  });

  logger.info(loggerPrefix, `Received ${ssmlParts.length} SSML parts to be used for the synthesizer.`);

  const synthesizerOptions: Polly.Types.SynthesizeSpeechInput = {
    OutputFormat: encodingParameter,
    VoiceId: voice.name,
    LanguageCode: voice.languageCode,
    TextType: 'ssml',
    Text: ''  // We fill this later
  };

  logger.info(loggerPrefix, 'Synthesize using these default synthsizer options:', synthesizerOptions);

  // Step 2: Send the SSML parts to Google's Text to Speech API and download the audio files
  const localAudiofilePaths = await awsSSMLPartsToSpeech(
    ssmlParts,
    'article',
    article.id,
    synthesizerOptions,
    storageUploadPath
  );

  logger.info(loggerPrefix, 'Received local audiofile paths:', localAudiofilePaths);

  // Step 3: Combine multiple audiofiles into one
  const concatinatedLocalAudiofilePath = await concatAudioFiles(
    localAudiofilePaths,
    storageUploadPath,
    encodingParameter
  );

  logger.info(loggerPrefix, 'Received concatinated audiofile path:', concatinatedLocalAudiofilePath);

  // Step 4: Get the length of the audiofile
  const audiofileLength = await getAudioFileDurationInSeconds(concatinatedLocalAudiofilePath);

  logger.info(loggerPrefix, 'Received audiofile duration in seconds:', audiofileLength);

  logger.info(loggerPrefix, 'Uploading the local audiofile to our storage...');

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

  logger.info(loggerPrefix, 'Audiofile successfully uploaded to our storage!');

  // Step 6: Delete the local file, we don't need it anymore
  const pathToRemove = `${appRootPath}/temp/${article.id}`;
  await fsExtra.remove(pathToRemove);

  logger.info(loggerPrefix, 'Removed temp audiofiles:', pathToRemove);

  // Step 7: Create a publicfile URL our users can use
  const publicFileUrl = storage.getPublicFileUrl(uploadResponse);

  logger.info(loggerPrefix, 'Got public file URL from our storage to be used for our users:', publicFileUrl);

  // Step 8: Return the audiofile properties needed for database insertion
  audiofile.url = publicFileUrl;
  audiofile.bucket = uploadResponse[0].bucket.name;
  audiofile.filename = uploadResponse[0].name;
  audiofile.length = audiofileLength;

  logger.info(loggerPrefix, 'Finished! Returning the created audiofile.');

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
  const ssmlParts = getSSMLParts(ssml, {
    softLimit: GOOGLE_CHARACTER_SOFT_LIMIT,
    hardLimit: GOOGLE_CHARACTER_HARD_LIMIT
  });

  const synthesizerOptions: IGoogleSynthesizerOptions = {
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
  const localAudiofilePaths = await googleSSMLPartsToSpeech(
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

  return audiofile;
};
