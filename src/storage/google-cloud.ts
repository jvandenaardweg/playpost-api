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
  console.log(`Uploading file "${filePath}" to Google Cloud Storage bucket "${BUCKET_NAME}" in directory "${uploadPath}"...`);

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
    console.log(`Uploaded file: ${publicFileUrl}`);
    return publicFileUrl;
  } catch (err) {
    throw new Error(err);
  }
};

export const listFiles = async () => {
  // Lists files in the bucket
  const [files] = await storage.bucket(BUCKET_NAME).getFiles();

  console.log('Files:');
  files.forEach(file => console.log(file.name));
};

export const listFilesByPrefix = async (prefix: string, delimiter?: string) => {
  // const bucketName = 'Name of a bucket, e.g. my-bucket';
  // const prefix = 'Prefix by which to filter, e.g. public/';
  // const delimiter = 'Delimiter to use, e.g. /';

  /**
   * This can be used to list all blobs in a "folder", e.g. "public/".
   *
   * The delimiter argument can be used to restrict the results to only the
   * "files" in the given "folder". Without the delimiter, the entire tree under
   * the prefix is returned. For example, given these blobs:
   *
   *   /a/1.txt
   *   /a/b/2.txt
   *
   * If you just specify prefix = '/a', you'll get back:
   *
   *   /a/1.txt
   *   /a/b/2.txt
   *
   * However, if you specify prefix='/a' and delimiter='/', you'll get back:
   *
   *   /a/1.txt
   */
  const options: GetFilesOptions = {
    prefix
  };

  if (delimiter) {
    options.delimiter = delimiter;
  }

  // Lists files in the bucket, filtered by a prefix
  const [files] = await storage.bucket(BUCKET_NAME).getFiles(options);

  // console.log('Files:');
  return files;
};
