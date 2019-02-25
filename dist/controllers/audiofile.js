"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const synthesizers_1 = require("../synthesizers");
const dataSource = __importStar(require("../data-sources/medium"));
const utils = __importStar(require("../utils"));
const storage = __importStar(require("../storage/google-cloud"));
exports.getAudiofile = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { url } = req.query;
    if (!url || url === '')
        return res.status(400).json({ message: 'Please give a URL param.' });
    const normalizedUrl = url.toLowerCase();
    // if (!normalizedUrl.includes('medium.com')) return res.status(400).json({ message: 'We only allow Medium URLs for now.' });
    // Get the Medium Post ID from the URL
    // If the URL is incorrect, we error
    const articleId = dataSource.getArticleIdFromUrl(normalizedUrl);
    // So in the future we can determine what voice a user wants to use
    // For example: "free" user maybe should use Amazon, because it's cheaper
    // For example: "premium" user maybe should use Google, because it's more expensive
    const synthesizerOptions = {
        synthesizer: 'Google',
        languageCode: 'en-US',
        name: 'en-US-Wavenet-D',
        source: 'medium-com' // or cnn-com
    };
    // Create an upload path based on the synthesizer options
    // We end up with something like this: google/en-us/en-us-wavenet-d/medium-com
    const uploadPath = Object.values(synthesizerOptions)
        .map(value => value.toLowerCase())
        .join('/');
    // Find an existing file in our cloud storage
    const existingFiles = yield storage.listFilesByPrefix(`${uploadPath}/`);
    const foundFile = existingFiles && existingFiles.length
        ? existingFiles.find(file => file.name.includes(articleId))
        : null;
    // If we already have a file in storage, we just return that (for now)
    // TODO: we should not use the cloud storage API for this? use a database?
    // so we an also return information about the article?
    if (foundFile) {
        return res.json({ publicFileUrl: storage.getPublicFileUrlFromMetaData(foundFile), article: {} });
    }
    // If we don't have an audiofile, we go into here
    // Get the SSML data for speech processing
    const _a = yield dataSource.getArticleById(articleId), { ssml } = _a, article = __rest(_a, ["ssml"]);
    // Split the SSML data in parts so we don't reach the character limit (5000)
    const ssmlParts = utils.ssml.getSSMLParts(ssml);
    // Send the SSML parts to Google's Text to Speech API and download the audio files
    const localAudiofilePaths = yield synthesizers_1.ssmlPartsToSpeech(articleId, ssmlParts, synthesizerOptions);
    // Uncomment for local dev testing purposes
    // const localAudiofilePaths = [
    //     '/Users/jordy/Projects/medium-audio/temp/medium-com/13eda868daeb/13eda868daeb-0.mp3',
    //     '/Users/jordy/Projects/medium-audio/temp/medium-com/13eda868daeb/13eda868daeb-1.mp3',
    //     '/Users/jordy/Projects/medium-audio/temp/medium-com/13eda868daeb/13eda868daeb-2.mp3',
    // ]
    // Concatinate the different files into one .mp3 file
    const concatinatedLocalAudiofilePath = utils.audio.concatAudioFiles(articleId, localAudiofilePaths, synthesizerOptions);
    // const audioFileDurationInSeconds = await utils.audio.getAudioFileDurationInSeconds(concatinatedLocalAudiofilePath);
    // Upload the one mp3 file to Google Cloud Storage
    const publicFileUrl = yield storage.uploadFile(concatinatedLocalAudiofilePath, uploadPath, synthesizerOptions);
    // TODO: Store all this data in a database
    // Cleanup the local audiofiles, we don't need that anymore
    yield utils.local.removeFile(`${global.appRoot}/temp/${synthesizerOptions.source}/${articleId}`);
    console.log('Done!');
    return res.json({ publicFileUrl, article });
});
//# sourceMappingURL=audiofile.js.map