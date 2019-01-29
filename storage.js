const { Storage } = require('@google-cloud/storage');
const BUCKET_NAME = "synthesized-audio-files";
const storage = new Storage();

const uploadFile = async (filename) => {
    // const bucketName = 'Name of a bucket, e.g. my-bucket';
    // const filename = 'Local file to upload, e.g. ./local/path/to/file.txt';

    // Uploads a local file to the bucket
    const uploadedFile = await storage.bucket(BUCKET_NAME).upload(filename, {
      // Support for HTTP requests made with `Accept-Encoding: gzip`
      gzip: true,
      metadata: {
        // Enable long-lived HTTP caching headers
        // Use only if the contents of the file will never change
        // (If the contents will change, use cacheControl: 'no-cache')
        cacheControl: 'public, max-age=31536000',
      },
    });

    console.log(`${filename} uploaded to ${BUCKET_NAME}.`);

    return uploadedFile;
}

const listFiles = async () => {
  // Lists files in the bucket
  const [files] = await storage.bucket(BUCKET_NAME).getFiles();

  console.log('Files:');
  files.forEach(file => {
    console.log(file.name);
  });
}

const listFilesByPrefix = async (prefix, delimiter) => {
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
  const options = {
    prefix: prefix,
  };

  if (delimiter) {
    options.delimiter = delimiter;
  }

  // Lists files in the bucket, filtered by a prefix
  const [files] = await storage.bucket(BUCKET_NAME).getFiles(options);

  console.log('Files:');
  files.forEach(file => {
    console.log(file.name);
  });
}

module.exports = { uploadFile, listFiles, listFilesByPrefix }