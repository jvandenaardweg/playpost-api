import { DeleteFileResponse, File, Storage, UploadOptions, UploadResponse } from '@google-cloud/storage';
import * as Sentry from '@sentry/node';

import * as request from 'request';
import { Article } from '../database/entities/article';
import { AudiofileMimeType } from '../database/entities/audiofile';
import { Voice } from '../database/entities/voice';
import { logger } from '../utils';
import { getGoogleCloudCredentials } from '../utils/credentials';

const storage = new Storage(getGoogleCloudCredentials());

const DEFAULT_BUCKET_NAME = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;

if (!DEFAULT_BUCKET_NAME) { throw new Error('Please set the GOOGLE_CLOUD_STORAGE_BUCKET_NAME environment variable.'); }

const DEFAULT_ARTICLE_AUDIOFILES_BASE_PATH = 'articles';
const DEFAULT_AUDIOFILES_BASE_PATH = 'audiofiles';
const DEFAULT_VOICE_PREVIEWS_BASE_PATH = 'voices';

export const getPublicFileUrlFromFileMetaData = (file: File) => {
  const { name } = file.metadata;
  return `https://${DEFAULT_BUCKET_NAME}/${name}`; // Example: https://storage.googleapis.com/synthesized-audio-files/13eda868daeb.mp3
};

export const getPublicFileUrl = (uploadResponse: UploadResponse) => {
  const file: File = uploadResponse[0];
  return getPublicFileUrlFromFileMetaData(file);
};

/**
 * Uploads a file to our Google Cloud Storage bucket. Returns the publicFileUrl
 */
export const uploadArticleAudioFile = async (voice: Voice, concatinatedLocalAudiofilePath: string, storageUploadPath: string, mimeType: AudiofileMimeType, article: Article, audiofileId: string, audiofileLength: number) => {
  const hrstart = process.hrtime();

  let extension = 'mp3';

  if (mimeType === 'audio/opus') {
    extension = 'opus';
  }

  if (mimeType === 'audio/wav') {
    extension = 'wav';
  }

  const destination = `${DEFAULT_ARTICLE_AUDIOFILES_BASE_PATH}/${storageUploadPath}.${extension}`;

  logger.info(`Google Cloud Storage (Upload Audiofile, Audiofile ID: ${audiofileId}): Uploading file "${concatinatedLocalAudiofilePath}" to bucket "${DEFAULT_BUCKET_NAME}" in "${destination}"...`);

  try {
    // Uploads a local file to the bucket
    const uploadOptions: UploadOptions = {
      destination,
      contentType: mimeType,
      gzip: true,
      metadata: {
        metadata: {
          audiofileLength,
          audiofileId,
          audiofileSynthesizer: voice.synthesizer,
          audiofileLanguageCode: voice.languageCode,
          audiofileVoice: voice.name,
          articleId: article.id,
          articleTitle: article.title,
          articleUrl: article.url,
          articleSourceName: article.sourceName
        },
        // Enable long-lived HTTP caching headers
        // Use only if the contents of the file will never change
        // (If the contents will change, use cacheControl: 'no-cache')
        cacheControl: 'public, max-age=31536000',
        contentLanguage: voice.language.code
      }
    }

    logger.info(`Google Cloud Storage (Upload Audiofile, Audiofile ID: ${audiofileId}): Uploading with options:`, uploadOptions);

    const uploadResponse = await upload(concatinatedLocalAudiofilePath, uploadOptions);

    logger.info(`Google Cloud Storage (Upload Audiofile, Audiofile ID: ${audiofileId}): Uploaded file!`, uploadResponse[0].metadata.name);

    return uploadResponse;
  } catch (err) {
    logger.error(`Google Cloud Storage (Upload Audiofile, Audiofile ID: ${audiofileId}): Failed to upload.`, err);

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('voice', voice);
      scope.setExtra('concatinatedLocalAudiofilePath', concatinatedLocalAudiofilePath);
      scope.setExtra('storageUploadPath', storageUploadPath);
      scope.setExtra('mimeType', mimeType);
      scope.setExtra('article', article);
      scope.setExtra('audiofileId', audiofileId);
      scope.setExtra('audiofileLength', audiofileLength);
      Sentry.captureException(err);
    });

    throw err;
  } finally {
    const hrend = process.hrtime(hrstart);
    const ds = hrend[0];
    const dms = hrend[1] / 1000000;
    logger.info(`Google Cloud Storage (Upload Audiofile, Audiofile ID: ${audiofileId}): Execution time (hr) of uploadFile(): ${ds} ${dms}ms`);
  }
};

/**
 * Uploads a file to our Google Cloud Storage bucket. Returns the publicFileUrl
 */
export const uploadVoicePreviewAudiofile = async (voice: Voice, audiofilePath: string, mimeType: AudiofileMimeType, audiofileLength: number) => {
  const hrstart = process.hrtime();
  const uploadPath = `${voice.id}`;

  let extension = 'mp3';

  if (mimeType === 'audio/opus') {
    extension = 'opus';
  }

  if (mimeType === 'audio/wav') {
    extension = 'wav';
  }

  const destination = `${DEFAULT_VOICE_PREVIEWS_BASE_PATH}/${uploadPath}.${extension}`;

  try {
    logger.info(`Google Cloud Storage (Upload Voice Preview, Voice ID: ${voice.id}): Uploading file "${audiofilePath}" to bucket "${DEFAULT_BUCKET_NAME}" in "${destination}"...`);

    // Uploads a local file to the bucket
    const uploadOptions: UploadOptions = {
      destination,
      contentType: mimeType,
      gzip: true,
      metadata: {
        metadata: {
          audiofileLength,
          voiceId: voice.id,
          voiceSynthesizer: voice.synthesizer,
          voiceLanguageCode: voice.languageCode,
          voiceName: voice.name
        },
        cacheControl: 'public, max-age=31536000',
        contentLanguage: voice.language.code
      }
    }

    logger.info(`Google Cloud Storage (Upload Voice Preview, Voice ID: ${voice.id}): Uploading with uptions:`, uploadOptions);

    const uploadResponse: UploadResponse = await upload(audiofilePath, uploadOptions);

    logger.info(`Google Cloud Storage (Upload Voice Preview, Voice ID: ${voice.id}): Uploaded file!`, uploadResponse[0].metadata.name);

    return uploadResponse;
  } catch (err) {
    logger.error(`Google Cloud Storage (Upload Voice Preview, Voice ID: ${voice.id}): Failed to upload.`, err);

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('voice', voice);
      scope.setExtra('audiofilePath', audiofilePath);
      scope.setExtra('mimeType', mimeType);
      scope.setExtra('audiofileLength', audiofileLength);
      Sentry.captureException(err);
    });

    throw err;
  } finally {
    const hrend = process.hrtime(hrstart);
    const ds = hrend[0];
    const dms = hrend[1] / 1000000;
    logger.info(`Google Cloud Storage (Upload Voice Preview, Voice ID: ${voice.id}): Execution time (hr) of uploadFile(): ${ds} ${dms}ms`);
  }
};

/**
 * Deletes a voice preview file from our Google Cloud Storage.
 * The method will first search the bucket by prefix. If it finds any files, it will delete the first one.
 * Because we just have one voice preview per voice.
 *
 * @param voiceId
 */
export const deleteVoicePreview = async (voiceId?: string) => {
  const loggerPrefix = 'Google Cloud Storage (Delete Voice Preview):';

  if (!voiceId) {
    const errorMessage = 'The voiceId parameter is required to delete the voice preview from storage.';
    logger.error(loggerPrefix, errorMessage);
    return new Error(errorMessage);
  }

  const prefix = `${DEFAULT_VOICE_PREVIEWS_BASE_PATH}/${voiceId}`;

  try {
    logger.info(loggerPrefix, `Finding files by prefix: "${prefix}"...`);
    const files = await getFiles(prefix);

    if (!files.length) {
      logger.error(loggerPrefix, `No files found for: "${prefix}"...`);
      throw new Error(`${loggerPrefix} No files found to be deleted.`);
    }

    const filename = files[0].name;
    logger.info(loggerPrefix, `Found: "${filename}". Deleting...`);

    const response = await deleteFile(filename);
    logger.info(loggerPrefix, `Successfully deleted: "${filename}"...`);
    return response;
  } catch (err) {
    logger.error(loggerPrefix, `Error while deleting voice preview: "${prefix}"...`, err);

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('voiceId', voiceId);
      scope.setExtra('prefix', prefix);
      Sentry.captureException(err);
    });

    throw err;
  }
};

/**
 * Deletes an article's audiofile from our Google Cloud Storage.
 * The method will first search the bucket by prefix. If it finds any files, it will delete the first one.
 * Because we just have one voice preview per voice.
 *
 * @param articleId
 * @param audiofileId
 */
export const deleteAudiofile = async (articleId: string, audiofileId: string) => {
  const loggerPrefix = 'Google Cloud Storage (Delete Audiofile):';

  if (!articleId || !audiofileId) {
    const errorMessage = 'Both the articleId and audiofileId parameters are required to delete the audiofile from storage.';
    logger.error(loggerPrefix, errorMessage);
    return new Error(errorMessage);
  }

  const prefix = `${DEFAULT_ARTICLE_AUDIOFILES_BASE_PATH}/${articleId}/${DEFAULT_AUDIOFILES_BASE_PATH}/${audiofileId}`;

  try {
    logger.info(loggerPrefix, `Finding files by prefix: "${prefix}"...`);
    const files = await getFiles(prefix);

    if (!files.length) {
      logger.error(loggerPrefix, `No files found for: "${prefix}"...`);
      throw new Error(`${loggerPrefix} No files found to be deleted.`);
    }

    const filename = files[0].name;
    logger.info(loggerPrefix, `Found: "${filename}". Deleting...`);

    const response = await deleteFile(filename);
    logger.info(loggerPrefix, `Successfully deleted: "${filename}"...`);
    return response;
  } catch (err) {
    logger.error(loggerPrefix, `Error while deleting audiofile: "${prefix}"...`, err);

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('articleId', articleId);
      scope.setExtra('audiofileId', audiofileId);
      scope.setExtra('prefix', prefix);
      Sentry.captureException(err);
    });

    throw err;
  }
};

/**
 * Deletes all the article's audiofiles from our Google Cloud Storage.
 * The method will first search the bucket by prefix. Then, it will delete all those results.
 * Because we just have one voice preview per voice.
 *
 * @param articleId
 */
export const deleteAllArticleAudiofiles = async (articleId?: string) => {
  const loggerPrefix = 'Google Cloud Storage (Delete All Article Audiofiles):';

  if (!articleId) {
    const errorMessage = 'articleId parameter is required to delete all the audiofiles for this article from storage.';
    logger.error(loggerPrefix, errorMessage);
    return new Error(errorMessage);
  }

  const prefix = `${DEFAULT_ARTICLE_AUDIOFILES_BASE_PATH}/${articleId}`;

  if (!articleId) { return new Error(`${loggerPrefix} articleId parameter is required for deleting an article's audiofiles.`); }

  try {
    logger.info(loggerPrefix, `Finding files by prefix: "${prefix}"...`);
    const files = await getFiles(prefix);

    if (!files.length) {
      logger.error(loggerPrefix, `No files found for: "${prefix}"...`);
      throw new Error(`${loggerPrefix} No files found to be deleted.`);
    }

    // Create delete file promises for each file
    const promises = files.map(file => {
      logger.info(loggerPrefix, `Found: "${file.name}". Deleting...`);
      return deleteFile(file.name);
    });

    // Delete all the files
    const responses = await Promise.all(promises);

    logger.info(loggerPrefix, 'Successfully deleted all files!');

    return responses;
  } catch (err) {
    logger.error(loggerPrefix, `Error while deleting audiofile: "${prefix}"...`, err);

    Sentry.withScope(scope => {
      scope.setLevel(Sentry.Severity.Critical);
      scope.setExtra('articleId', articleId);
      scope.setExtra('prefix', prefix);
      Sentry.captureException(err);
    });

    throw err;
  }
};

export const getFiles = async (prefix: string): Promise<File[]> => {
  const [files] = await storage.bucket(`${DEFAULT_BUCKET_NAME}`).getFiles({ prefix });
  return files;
}

export const deleteFile = async (filename: string): Promise<[request.Response]> => {
  const deleteFileResponse: DeleteFileResponse = await storage
    .bucket(DEFAULT_BUCKET_NAME)
    .file(filename)
    .delete();

  return deleteFileResponse;
};

export const upload = async (audiofilePath: string, uploadOptions: UploadOptions): Promise<[File, request.Response]> => {
  const uploadResponse = await storage.bucket(DEFAULT_BUCKET_NAME).upload(audiofilePath, uploadOptions);
  return uploadResponse;
}
