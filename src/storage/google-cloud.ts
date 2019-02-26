import path from 'path';
import { Storage, UploadResponse, GetFilesOptions, File } from '@google-cloud/storage';
import { SynthesizerOptions } from '../synthesizers';
import { getGoogleCloudCredentials } from '../utils/credentials';

const storage = new Storage(getGoogleCloudCredentials());

const BUCKET_NAME = 'synthesized-audio-files';

/* eslint-disable no-console */
export const getPublicFileUrlFromFileMetaData = (file: File) => {
  const { bucket, name } = file.metadata;
  // Example: https://storage.googleapis.com/synthesized-audio-files/13eda868daeb.mp3
  return `https://storage.googleapis.com/${bucket}/${name}`;
};

export const getPublicFileUrl = (uploadResponse: UploadResponse) => {
  const file = uploadResponse[0];
  return getPublicFileUrlFromFileMetaData(file);
};

export const uploadFile = async (filePath: string, uploadPath: string, synthesizerOptions: SynthesizerOptions) => {
  console.log(`Google Cloud Storage, oploading file "${filePath}" to bucket "${BUCKET_NAME}" in directory "${uploadPath}"...`);

  // TODO: Make sure the "uploadPath" exists in the cloud

  try {
    const filename = path.basename(filePath);
    const destination = `${uploadPath}/${filename}`;

    const {
      synthesizer,
      languageCode,
      name,
      source
    } = synthesizerOptions;

    // Uploads a local file to the bucket
    // https://www.googleapis.com/storage/v1/b/synthesized-audio-files/o/13eda868daeb.mp3
    const uploadResponse: UploadResponse = await storage.bucket(BUCKET_NAME).upload(filePath, {
      destination,
      gzip: true,
      metadata: {
        metadata: {
          synthesizer,
          languageCode,
          name,
          source,
        },
        // Enable long-lived HTTP caching headers
        // Use only if the contents of the file will never change
        // (If the contents will change, use cacheControl: 'no-cache')
        cacheControl: 'public, max-age=31536000',
      }
    });

    const publicFileUrl = getPublicFileUrl(uploadResponse);
    console.log(`Google Cloud Storage, Uploaded file: ${publicFileUrl}`);
    return publicFileUrl;
  } catch (err) {
    console.log('Google Cloud Storage, failed to upload.');
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
