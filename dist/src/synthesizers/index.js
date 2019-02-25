"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const google_1 = require("./google");
const aws_1 = require("./aws");
/* eslint-disable no-console */
exports.ssmlPartsToSpeech = (id, ssmlParts, synthesizerOptions) => {
    const { synthesizer } = synthesizerOptions;
    const availableSynthesizers = ['Google', 'AWS'];
    if (!availableSynthesizers.includes(synthesizer)) {
        throw new Error(`Synthesizer option ${synthesizer} is not available. Please use: ${availableSynthesizers.join(' or ')}`);
    }
    console.log(`Using synthesizer "${synthesizer}".`);
    if (synthesizer === 'Google') {
        return google_1.GooglessmlPartsToSpeech(id, ssmlParts, synthesizerOptions);
    }
    return aws_1.AWSssmlPartsToSpeech(id, ssmlParts, synthesizerOptions);
};
//# sourceMappingURL=index.js.map