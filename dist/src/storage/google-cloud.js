"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const path_1 = __importDefault(require("path"));
const storage_1 = require("@google-cloud/storage");
const credentials_1 = require("../utils/credentials");
const storage = new storage_1.Storage(credentials_1.getGoogleCloudCredentials());
const BUCKET_NAME = 'synthesized-audio-files';
/* eslint-disable no-console */
exports.getPublicFileUrlFromMetaData = (file) => {
    const { bucket, name } = file.metadata;
    // Example: https://storage.googleapis.com/synthesized-audio-files/13eda868daeb.mp3
    return `https://storage.googleapis.com/${bucket}/${name}`;
};
exports.getPublicFileUrl = (uploadResponse) => {
    // TODO: might change [0] back to [1]
    const { bucket, name } = uploadResponse[0];
    // Example: https://storage.googleapis.com/synthesized-audio-files/13eda868daeb.mp3
    return `https://storage.googleapis.com/${bucket}/${name}`;
};
exports.uploadFile = (filePath, uploadPath, synthesizerOptions) => __awaiter(this, void 0, void 0, function* () {
    console.log(`Uploading file "${filePath}" to Google Cloud Storage bucket "${BUCKET_NAME}" in directory "${uploadPath}"...`);
    // TODO: Make sure the "uploadPath" exists in the cloud
    try {
        const filename = path_1.default.basename(filePath);
        const destination = `${uploadPath}/${filename}`;
        const { synthesizer, languageCode, name, source } = synthesizerOptions;
        // Uploads a local file to the bucket
        // https://www.googleapis.com/storage/v1/b/synthesized-audio-files/o/13eda868daeb.mp3
        const uploadedFile = yield storage.bucket(BUCKET_NAME).upload(filePath, {
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
        const publicFileUrl = exports.getPublicFileUrl(uploadedFile);
        console.log(`Uploaded file: ${publicFileUrl}`);
        return publicFileUrl;
    }
    catch (err) {
        throw new Error(err);
    }
});
exports.listFiles = () => __awaiter(this, void 0, void 0, function* () {
    // Lists files in the bucket
    const [files] = yield storage.bucket(BUCKET_NAME).getFiles();
    console.log('Files:');
    files.forEach(file => console.log(file.name));
});
exports.listFilesByPrefix = (prefix, delimiter) => __awaiter(this, void 0, void 0, function* () {
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
        prefix
    };
    if (delimiter) {
        options.delimiter = delimiter;
    }
    // Lists files in the bucket, filtered by a prefix
    const [files] = yield storage.bucket(BUCKET_NAME).getFiles(options);
    // console.log('Files:');
    return files;
});
//# sourceMappingURL=google-cloud.js.map