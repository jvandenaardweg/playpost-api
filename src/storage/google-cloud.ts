require('dotenv').config();
import { Storage, UploadResponse, GetFilesOptions, File, DeleteFileResponse } from '@google-cloud/storage';
import { getGoogleCloudCredentials } from '../utils/credentials';
import { Article } from '../database/entities/article';
import { Voice } from '../database/entities/voice';
import { AudiofileMimeType } from '../database/entities/audiofile';

import LocaleCode from 'locale-code';
import { logger } from '../utils';

const storage = new Storage(getGoogleCloudCredentials());
const DEFAULT_BUCKET_NAME = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;

if (!DEFAULT_BUCKET_NAME) throw new Error('Please set the GOOGLE_CLOUD_STORAGE_BUCKET_NAME environment variable.');

const DEFAULT_ARTICLE_AUDIOFILES_BASE_PATH = 'articles';
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
export const uploadArticleAudioFile = async (
  voice: Voice,
  concatinatedLocalAudiofilePath: string,
  storageUploadPath: string,
  mimeType: AudiofileMimeType,
  article: Article,
  audiofileId: string,
  audiofileLength: number
) => {
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
    const uploadResponse: UploadResponse = await storage.bucket(DEFAULT_BUCKET_NAME).upload(concatinatedLocalAudiofilePath, {
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
          articleSourceName: article.sourceName,
        },
        // Enable long-lived HTTP caching headers
        // Use only if the contents of the file will never change
        // (If the contents will change, use cacheControl: 'no-cache')
        cacheControl: 'public, max-age=31536000',
        contentLanguage: LocaleCode.getLanguageCode(voice.languageCode) // "en-US" becomes: "en"
      }
    });

    logger.info(`Google Cloud Storage (Upload Audiofile, Audiofile ID: ${audiofileId}): Uploaded file!`, uploadResponse[0].metadata.name);

    return uploadResponse;
  } catch (err) {
    logger.error(`Google Cloud Storage (Upload Audiofile, Audiofile ID: ${audiofileId}): Failed to upload.`, err);
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
export const uploadVoicePreviewAudiofile = async (
  voice: Voice,
  audiofilePath: string,
  mimeType: AudiofileMimeType,
  audiofileLength: number
) => {
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
    const uploadResponse: UploadResponse = await storage.bucket(DEFAULT_BUCKET_NAME).upload(audiofilePath, {
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
        contentLanguage: LocaleCode.getLanguageCode(voice.languageCode) // "en-US" becomes: "en"
      }
    });

    logger.info(`Google Cloud Storage (Upload Voice Preview, Voice ID: ${voice.id}): Uploaded file!`, uploadResponse[0].metadata.name);

    return uploadResponse;
  } catch (err) {
    logger.error(`Google Cloud Storage (Upload Voice Preview, Voice ID: ${voice.id}): Failed to upload.`, err);
    throw err;
  } finally {
    const hrend = process.hrtime(hrstart);
    const ds = hrend[0];
    const dms = hrend[1] / 1000000;
    logger.info(`Google Cloud Storage (Upload Voice Preview, Voice ID: ${voice.id}): Execution time (hr) of uploadFile(): ${ds} ${dms}ms`);
  }
};

export const deleteFile = async (filename: string) => {
  try {
    logger.info(`Google Cloud Storage (Delete File): Deleting file "${filename}"...`);

    const deleteFileResponse: DeleteFileResponse = await storage.bucket(DEFAULT_BUCKET_NAME).file(filename).delete();

    logger.info(`Google Cloud Storage (Delete File): Successfully deleted file "${filename}"!`);

    return deleteFileResponse;
  } catch (err) {
    logger.error(`Google Cloud Storage (Delete File): Failed to delete file "${filename}"!`, err);
    throw err;
  }
};
