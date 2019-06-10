import pino from 'pino';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_STAGING = process.env.NODE_ENV === 'staging';

export const logger = pino({
  base: null,
  ...(IS_PRODUCTION || IS_STAGING) ? { timestamp: false } : {},
  prettyPrint: {
    colorize: (IS_PRODUCTION || IS_STAGING) ? false : true,
    levelFirst: true,
    errorLikeObjectKeys: ['err', 'error'],
    translateTime: (IS_PRODUCTION || IS_STAGING) ? false : true,
    ignore: (IS_PRODUCTION || IS_STAGING) ? 'time' : undefined
  },
});
