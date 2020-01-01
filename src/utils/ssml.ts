import ssmlSplit from 'ssml-split';
import { logger } from '../utils';

export const GOOGLE_CHARACTER_HARD_LIMIT = 5000;
export const GOOGLE_CHARACTER_SOFT_LIMIT = 3000;

export const AWS_CHARACTER_HARD_LIMIT = 3000;
export const AWS_CHARACTER_SOFT_LIMIT = 1500;

export const MICROSOFT_CHARACTER_HARD_LIMIT = 1000; // 1024, but we take it safe
export const MICROSOFT_CHARACTER_SOFT_LIMIT = 500;

export const DEFAULT_SSML_SPLIT_HARD_LIMIT = AWS_CHARACTER_HARD_LIMIT;
export const DEFAULT_SSML_SPLIT_SOFT_LIMIT = AWS_CHARACTER_SOFT_LIMIT;

interface ISsmlSplitOptions {
  softLimit?: number;
  hardLimit: number;
  extraSplitChars?: string;
  includeSSMLTagsInCounter?: boolean;
}

export const getSSMLParts = (ssml: string, optionsOverwrite?: ISsmlSplitOptions) => {
  const loggerPrefix = 'SSML (Util):';

  const defaultOptions: ISsmlSplitOptions = {
    hardLimit: DEFAULT_SSML_SPLIT_HARD_LIMIT, // MAX length of a single batch of split text
    softLimit: DEFAULT_SSML_SPLIT_SOFT_LIMIT, // MIN length of a single batch of split text
    // extraSplitChars: '.', // Set of extra split characters (Optional property)
    includeSSMLTagsInCounter: true
  };

  let options = defaultOptions;

  if (optionsOverwrite) {
    options = { ...defaultOptions, ...optionsOverwrite };
  }

  ssmlSplit.configure(options);

  logger.info(loggerPrefix, 'Splitting SSML content into different parts using options: ', options);

  const ssmlParts: string[] = ssmlSplit.split(ssml);

  if (!ssmlParts || !ssmlParts.length) {
    const errorMessage = 'Got no SSML parts.';
    logger.error(loggerPrefix, errorMessage);
    throw new Error(errorMessage);
  }

  logger.info(loggerPrefix, `Successfully splitted the SSML into ${ssmlParts.length} SSML parts.`);

  return ssmlParts;
};
