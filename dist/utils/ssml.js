"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const polly_ssml_split_1 = __importDefault(require("polly-ssml-split"));
/* eslint-disable no-console */
// Configuration example with default values
const options = {
    // MIN length of a single batch of split text
    softLimit: 4000,
    // MAX length of a single batch of split text
    hardLimit: 5000,
};
// Apply configuration
polly_ssml_split_1.default.configure(options);
exports.getSSMLParts = (ssml) => {
    console.log('Splitting SSML content into different parts...');
    const ssmlParts = polly_ssml_split_1.default.split(ssml);
    if (!ssmlParts || !ssmlParts.length)
        throw new Error('Got no SSML parts.');
    console.log(`Got ${ssmlParts.length} SSML parts.`);
    return ssmlParts;
};
//# sourceMappingURL=ssml.js.map