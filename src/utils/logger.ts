import pino from 'pino';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const logger = pino({
  base: null,
  ...IS_PRODUCTION ? { timestamp: false } : {},
  prettyPrint: {
    colorize: (IS_PRODUCTION) ? false : true,
    levelFirst: true,
    errorLikeObjectKeys: ['err', 'error'],
    translateTime: (IS_PRODUCTION) ? false : true,
    ignore: (IS_PRODUCTION) ? 'time' : undefined
  },
});
