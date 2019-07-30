import pino from 'pino';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_STAGING = process.env.NODE_ENV === 'staging';
const IS_TEST = process.env.HEROKU_APP_ID;

export const logger = pino({
  enabled: !IS_TEST,
  base: null,
  ...(IS_PRODUCTION || IS_STAGING || IS_TEST ? { timestamp: false } : {}),
  prettyPrint: {
    colorize: IS_PRODUCTION || IS_STAGING || IS_TEST ? false : true,
    levelFirst: true,
    errorLikeObjectKeys: ['err', 'error'],
    translateTime: IS_PRODUCTION || IS_STAGING || IS_TEST ? false : true,
    ignore: IS_PRODUCTION || IS_STAGING || IS_TEST ? 'time' : undefined
  }
});
