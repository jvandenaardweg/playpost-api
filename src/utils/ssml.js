const pollySSMLSplit = require('polly-ssml-split');

/* eslint-disable no-console */

// Configuration example with default values
const options = {
  // MIN length of a single batch of split text
  softLimit: 4000,
  // MAX length of a single batch of split text
  hardLimit: 5000,
  // Set of extra split characters (Optional property)
  // extraSplitChars: ',;',
};

// Apply configuration
pollySSMLSplit.configure(options);

const getSSMLParts = (ssml) => {
  return new Promise((resolve, reject) => {
    console.log('Splitting SSML content into different parts...');

    const ssmlParts = pollySSMLSplit.split(ssml);

    if (!ssmlParts || !ssmlParts.length) return reject(new Error('Got no SSML parts.'));

    console.log(`Got ${ssmlParts.length} SSML parts.`);
    return resolve(ssmlParts);
  });
};

module.exports = {
  getSSMLParts
};
