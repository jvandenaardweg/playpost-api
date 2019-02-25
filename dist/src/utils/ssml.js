"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const pollySSMLSplit = __importStar(require("polly-ssml-split"));
/* eslint-disable no-console */
// Configuration example with default values
const options = {
    // MIN length of a single batch of split text
    softLimit: 4000,
    // MAX length of a single batch of split text
    hardLimit: 5000,
};
// Apply configuration
pollySSMLSplit.configure(options);
exports.getSSMLParts = (ssml) => {
    console.log('Splitting SSML content into different parts...');
    const ssmlParts = pollySSMLSplit.split(ssml);
    if (!ssmlParts || !ssmlParts.length)
        throw new Error('Got no SSML parts.');
    console.log(`Got ${ssmlParts.length} SSML parts.`);
    return ssmlParts;
};
//# sourceMappingURL=ssml.js.map