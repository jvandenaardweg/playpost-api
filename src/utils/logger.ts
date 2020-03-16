import pino from 'pino';

const IS_JEST = process.env.JEST_WORKER_ID;

export const logger = pino({
  enabled: !IS_JEST,
  base: null,
  ...(process.env.API_ENVIRONMENT !== 'development' ? { timestamp: false } : {}),
  prettyPrint: {
    colorize: process.env.API_ENVIRONMENT !== 'development' ? false : true,
    levelFirst: true,
    errorLikeObjectKeys: ['err', 'error'],
    translateTime: process.env.API_ENVIRONMENT !== 'development' ? false : true,
    ignore: process.env.API_ENVIRONMENT !== 'development' ? 'time' : undefined
  }
});
