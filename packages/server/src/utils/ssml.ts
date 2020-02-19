import SSMLSplit, { OptionsInput } from 'ssml-split';
import { logger } from '../utils';

export const GOOGLE_CHARACTER_HARD_LIMIT = 5000;
export const GOOGLE_CHARACTER_SOFT_LIMIT = 4000;

export const AWS_CHARACTER_HARD_LIMIT = 3000;
export const AWS_CHARACTER_SOFT_LIMIT = 2000;

export const MICROSOFT_CHARACTER_HARD_LIMIT = 1000; // 1024, but we take it safe
export const MICROSOFT_CHARACTER_SOFT_LIMIT = 500;

export const DEFAULT_SSML_SPLIT_HARD_LIMIT = AWS_CHARACTER_HARD_LIMIT;
export const DEFAULT_SSML_SPLIT_SOFT_LIMIT = AWS_CHARACTER_SOFT_LIMIT;

export const getSSMLParts = (ssml: string, optionsOverwrite?: OptionsInput) => {
  const loggerPrefix = 'SSML (Util):';

  const defaultOptions: OptionsInput = {
    synthesizer: 'google',
    hardLimit: DEFAULT_SSML_SPLIT_HARD_LIMIT, // MAX length of a single batch of split text
    softLimit: DEFAULT_SSML_SPLIT_SOFT_LIMIT, // MIN length of a single batch of split text
    breakParagraphsAboveHardLimit: true,
  };

  let options = defaultOptions;

  if (optionsOverwrite) {
    options = { ...defaultOptions, ...optionsOverwrite };
  }

  const ssmlSplit = new SSMLSplit(options)

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
