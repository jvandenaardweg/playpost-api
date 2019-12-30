import { Article } from '../database/entities/article';
import { Audiofile, AudiofileMimeType } from '../database/entities/audiofile';
import { Voice } from '../database/entities/voice';
import { SynthesizerService } from '../services/synthesizer-service';
import { logger } from '../utils';

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

  const synthesizerName = voice.synthesizer === 'Google' ? 'google' : 'aws';
  const synthesizerService = new SynthesizerService(synthesizerName);

  const bucketName = `${process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME}`;

  const synthesizeUploadResult = await synthesizerService.upload({
    outputFormat: synthesizerService.mimeTypeToFormat(mimeType),
    bucketName,
    bucketUploadDestination: storageUploadPath,
    ssml,
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
