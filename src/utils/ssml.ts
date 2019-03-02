import pollySsmlSplit from 'polly-ssml-split';

/* eslint-disable no-console */

// Configuration example with default values
const options = {
  softLimit: 4000, // MIN length of a single batch of split text
  hardLimit: 5000, // MAX length of a single batch of split text
  // extraSplitChars: ',;', // Set of extra split characters (Optional property)
};

// Apply configuration
pollySsmlSplit.configure(options);

export const getSSMLParts = (ssml: string) => {
  console.log('Splitting SSML content into different parts...');

  const ssmlParts = pollySsmlSplit.split(ssml);

  if (!ssmlParts || !ssmlParts.length) throw new Error('Got no SSML parts.');

  console.log(`Got ${ssmlParts.length} SSML parts.`);
  return ssmlParts;
};
