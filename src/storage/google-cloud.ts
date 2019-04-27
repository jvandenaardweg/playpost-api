require('dotenv').config();
import { Storage, UploadResponse, GetFilesOptions, File, DeleteFileResponse } from '@google-cloud/storage';
import { getGoogleCloudCredentials } from '../utils/credentials';
import { Article } from '../database/entities/article';
import { Voice } from '../database/entities/voice';
import { AudiofileMimeType } from '../database/entities/audiofile';

import LocaleCode from 'locale-code';

const storage = new Storage(getGoogleCloudCredentials());
const DEFAULT_BUCKET_NAME = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;
const STORAGE_BASE_URL = process.env.GOOGLE_CLOUD_STORAGE_BASE_URL;

/* eslint-disable no-console */

export const getPublicFileUrlFromFileMetaData = (file: File) => {
  const { bucket, name } = file.metadata;
  return `${STORAGE_BASE_URL}/${bucket}/${name}`; // Example: https://storage.googleapis.com/synthesized-audio-files/13eda868daeb.mp3
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

  console.log(`Google Cloud Storage: Uploading file "${concatinatedLocalAudiofilePath}" to bucket "${DEFAULT_BUCKET_NAME}" in directory "${storageUploadPath}"...`);

  let extension = 'mp3';

  if (mimeType === 'audio/opus') {
    extension = 'opus';
  }

  try {
    // Uploads a local file to the bucket
    const uploadResponse: UploadResponse = await storage.bucket(DEFAULT_BUCKET_NAME).upload(concatinatedLocalAudiofilePath, {
      contentType: mimeType,
      destination: `${storageUploadPath}.${extension}`,
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

    console.log('Google Cloud Storage: Uploaded file!', uploadResponse[0].metadata.name);

    return uploadResponse;
  } catch (err) {
    console.log('Google Cloud Storage: Failed to upload.');
    console.error(err);
    throw new Error(err);
  } finally {
    const hrend = process.hrtime(hrstart);
    console.info('Execution time (hr) of uploadFile(): %ds %dms', hrend[0], hrend[1] / 1000000);
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
  const uploadPath = `voice-previews/${voice.id}`;

  console.log(`Google Cloud Storage: Uploading file "${audiofilePath}" to bucket "${DEFAULT_BUCKET_NAME}" in directory "${uploadPath}"...`);

  let extension = 'mp3';

  if (mimeType === 'audio/wav') {
    extension = 'wav';
  }

  try {
    // Uploads a local file to the bucket
    const uploadResponse: UploadResponse = await storage.bucket(DEFAULT_BUCKET_NAME).upload(audiofilePath, {
      contentType: mimeType,
      destination: `${uploadPath}.${extension}`,
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

    console.log('Google Cloud Storage: Uploaded file!', uploadResponse[0].metadata.name);

    return uploadResponse;
  } catch (err) {
    console.log('Google Cloud Storage: Failed to upload.');
    console.error(err);
    throw new Error(err);
  } finally {
    const hrend = process.hrtime(hrstart);
    console.info('Execution time (hr) of uploadFile(): %ds %dms', hrend[0], hrend[1] / 1000000);
  }
};

export const listFiles = async () => {
  // Lists files in the bucket
  const [files] = await storage.bucket(DEFAULT_BUCKET_NAME).getFiles();

  console.log('Google Cloud Storage, listFiles()');

  files.forEach((file: File) => console.log(file.name));
};

export const listFilesByPrefix = async (prefix: string, delimiter?: string) => {
  const options: GetFilesOptions = {
    prefix
  };

  if (delimiter) {
    options.delimiter = delimiter;
  }

  console.log('Google Cloud Storage, listFilesByPrefix()');

  // Lists files in the bucket, filtered by a prefix
  const [files] = await storage.bucket(DEFAULT_BUCKET_NAME).getFiles(options);

  return files;
};

export const deleteFile = async (filename: string) => {
  console.log(`Google Cloud Storage: Deleting file "${filename}"...`);

  const deleteFileResponse: DeleteFileResponse = await storage.bucket(DEFAULT_BUCKET_NAME).file(filename).delete();

  console.log(`Google Cloud Storage: Successfully deleted file "${filename}"!`);

  return deleteFileResponse;
};
