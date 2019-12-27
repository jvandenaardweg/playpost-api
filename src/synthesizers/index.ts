// import appRootPath from 'app-root-path';
import { Polly } from 'aws-sdk';

import { Article } from '../database/entities/article';
import { Audiofile, AudiofileMimeType } from '../database/entities/audiofile';
import { EVoiceSynthesizer, Voice } from '../database/entities/voice';
import { SynthesizerService } from '../services/synthesizer-service';
import { logger } from '../utils';
import { GoogleAudioEncoding } from './google';

export type SynthesizerType = 'article' | 'preview';
export type SynthesizerAudioEncodingTypes = GoogleAudioEncoding & Polly.OutputFormat;

export enum SynthesizerEncoding {
  GOOGLE_MP3 = 'MP3',
  GOOGLE_OGG_OPUS = 'OGG_OPUS',
  GOOGLE_LINEAR16 = 'LINEAR16',
  AWS_MP3 = 'mp3',
  AWS_PCM = 'pcm',
  AWS_OGG_VORBIS = 'ogg_vorbis'
}

export * from './synthesizers';

/**
 * Converts the given mimeType to the correct encoding parameter for the synthesizer service to use.
 *
 * For example: when someone requests an article text to be synthesized into a "audio/mpeg" file, the synthesizer will use the parameter:
 * { "audioConfig": { "audioEncoding": "MP3" } } (Google)
 * or
 * { "OutputFormat": "mp3" } (AWS)
 *
 */
export const mimeTypeToEncoderParameter = (mimeType: AudiofileMimeType, synthesizer: EVoiceSynthesizer) => {
  if (mimeType === 'audio/mpeg') {
    return (synthesizer === EVoiceSynthesizer.GOOGLE) ? SynthesizerEncoding.GOOGLE_MP3 : SynthesizerEncoding.AWS_MP3;
  }

  if (mimeType === 'audio/wav') {
    return (synthesizer === EVoiceSynthesizer.GOOGLE) ? SynthesizerEncoding.GOOGLE_MP3 : null;
  }

  if (mimeType === 'audio/pcm') {
    return (synthesizer === EVoiceSynthesizer.GOOGLE) ? null : SynthesizerEncoding.AWS_PCM;
  }

  if (mimeType === 'audio/ogg') {
    return (synthesizer === EVoiceSynthesizer.GOOGLE) ? null : SynthesizerEncoding.AWS_OGG_VORBIS;
  }

  if (mimeType === 'audio/opus') {
    return (synthesizer === EVoiceSynthesizer.GOOGLE) ? SynthesizerEncoding.GOOGLE_OGG_OPUS : null;
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

  if (!['Google', 'AWS'].includes(voice.synthesizer)) {
    const errorMessage = 'Synthesizer not supported.';
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  const synthesizerService = new SynthesizerService();
  const bucketName = `${process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME}`;

  const synthesizeUploadResult = await synthesizerService.upload({
    bucketName,
    bucketUploadDestination: storageUploadPath,
    ssml,
    synthesizerName: voice.synthesizer === 'Google' ? 'google' : 'aws',
    voiceLanguageCode: voice.languageCode,
    voiceName: voice.name,
    voiceSsmlGender: voice.gender
  })

  // Return the audiofile properties needed for database insertion
  audiofile.url = synthesizeUploadResult.publicFileUrl;
  audiofile.bucket = bucketName;
  audiofile.filename = storageUploadPath;
  audiofile.length = synthesizeUploadResult.durationInSeconds;

  const hrend = process.hrtime(hrstart);
  logger.info(loggerPrefix, 'Execution time:', hrend[0], hrend[1] / 1000000);

  logger.info(loggerPrefix, 'Ended. Returning the created audiofile.');

  // Return the audiofile with the correct properties, so it can be saved in the database
  return audiofile;
};
