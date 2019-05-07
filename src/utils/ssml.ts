import pollySsmlSplit from 'polly-ssml-split';
import { logger } from '../utils';

export const GOOGLE_CHARACTER_LIMIT = 5000;
export const AWS_CHARACTER_LIMIT = 3000;

interface SsmlSplitOptions {
  softLimit?: number;
  hardLimit: number;
}

/* eslint-disable no-console */

export const getSSMLParts = (ssml: string, optionsOverwrite?: SsmlSplitOptions) => {
  const loggerPrefix = 'SSML (Util):';

  const defaultOptions: SsmlSplitOptions = {
    softLimit: AWS_CHARACTER_LIMIT, // MIN length of a single batch of split text
    hardLimit: GOOGLE_CHARACTER_LIMIT, // MAX length of a single batch of split text
    // extraSplitChars: ',;', // Set of extra split characters (Optional property)
  };

  let options = defaultOptions;

  if (optionsOverwrite) {
    options = { ...defaultOptions, ...optionsOverwrite };
  }

  pollySsmlSplit.configure(options);

  logger.info(loggerPrefix, 'Splitting SSML content into different parts using options: ', options);

  const ssmlParts: string[] = pollySsmlSplit.split(ssml);

  if (!ssmlParts || !ssmlParts.length) {
    const errorMessage = 'Got no SSML parts.';
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  logger.info(loggerPrefix, `Successfully splitted the SSML into ${ssmlParts.length} SSML parts.`);

  return ssmlParts;
};
