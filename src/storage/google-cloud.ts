import path from 'path';
import { Storage, UploadResponse, GetFilesOptions, File, DeleteFileOptions, DeleteFileResponse } from '@google-cloud/storage';
import { SynthesizerOptions } from '../synthesizers';
import { getGoogleCloudCredentials } from '../utils/credentials';
import { Article } from 'database/entities/article';
import { Audiofile } from 'database/entities/audiofile';

const storage = new Storage(getGoogleCloudCredentials());

const BUCKET_NAME = 'synthesized-audio-files';

/* eslint-disable no-console */

export const getPublicFileUrlFromFileMetaData = (file: File) => {
  const { bucket, name } = file.metadata;
  return `https://storage.googleapis.com/${bucket}/${name}`; // Example: https://storage.googleapis.com/synthesized-audio-files/13eda868daeb.mp3
};

export const getPublicFileUrl = (uploadResponse: UploadResponse) => {
  const file: File = uploadResponse[0];
  return getPublicFileUrlFromFileMetaData(file);
};

/**
 * Uploads a file to our Google Cloud Storage bucket. Returns the publicFileUrl
 */
export const uploadFile = async (
  concatinatedLocalAudiofilePath: string,
  storageUploadPath: string,
  synthesizerOptions: SynthesizerOptions,
  article: Article,
  audiofile: Audiofile,
  audiofileLengthInSeconds: number
) => {
  console.log(`Google Cloud Storage: Uploading file "${concatinatedLocalAudiofilePath}" to bucket "${BUCKET_NAME}" in directory "${storageUploadPath}"...`);

  try {
    // Uploads a local file to the bucket
    const uploadResponse: UploadResponse = await storage.bucket(BUCKET_NAME).upload(concatinatedLocalAudiofilePath, {
      destination: storageUploadPath,
      gzip: true,
      metadata: {
        metadata: {
          audiofileId: audiofile.id,
          audiofileLength: audiofileLengthInSeconds,
          audiofileSynthesizer: synthesizerOptions.synthesizer,
          audiofileLanguageCode: synthesizerOptions.languageCode,
          audiofileVoice: synthesizerOptions.name,
          audiofileEncoding: synthesizerOptions.encoding,
          articleId: article.id,
          articleTitle: article.title,
          articleUrl: article.url,
          articleSourceName: article.sourceName
        },
        // Enable long-lived HTTP caching headers
        // Use only if the contents of the file will never change
        // (If the contents will change, use cacheControl: 'no-cache')
        cacheControl: 'public, max-age=31536000',
      }
    });

    console.log('Google Cloud Storage: Uploaded file!');

    return uploadResponse;
  } catch (err) {
    console.log('Google Cloud Storage: Failed to upload.');
    console.error(err);
    throw new Error(err);
  }
};

export const listFiles = async () => {
  // Lists files in the bucket
  const [files] = await storage.bucket(BUCKET_NAME).getFiles();

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
  const [files] = await storage.bucket(BUCKET_NAME).getFiles(options);

  return files;
};

export const deleteFile = async (filename: string) => {
  console.log(`Google Cloud Storage: Deleting file "${filename}"...`);

  const deleteFileResponse: DeleteFileResponse = await storage.bucket(BUCKET_NAME).file(filename).delete();
  return deleteFileResponse;
}
