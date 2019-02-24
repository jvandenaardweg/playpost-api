const google = require('./google');
const aws = require('./aws');

/* eslint-disable no-console */

const ssmlPartsToSpeech = (id, ssmlParts, synthesizerOptions) => {
  const { synthesizer } = synthesizerOptions;
  const availableSynthesizers = ['google', 'aws'];

  if (!availableSynthesizers.includes(synthesizer)) {
    return new Error(`Synthesizer option ${synthesizer} is not available. Please use: ${availableSynthesizers.join(' or ')}`);
  }

  console.log(`Using synthesizer "${synthesizer}".`);

  if (synthesizer === 'google') {
    return google.ssmlPartsToSpeech(id, ssmlParts, synthesizerOptions);
  }

  return aws.ssmlPartsToSpeech(id, ssmlParts, synthesizerOptions);
};

module.exports = {
  ssmlPartsToSpeech
};
