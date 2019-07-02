require('dotenv').config();
import IORedis from 'ioredis';
import RateLimitRedis from 'rate-limit-redis';
import ExpressBruteRedis from 'express-brute-redis';

export const redisClient = new IORedis(process.env.REDIS_URL);

// @ts-ignore
export const expressBruteRedisStore = new ExpressBruteRedis({ client: redisClient });

export const expressRateLimitRedisStore = new RateLimitRedis({
  client: redisClient
});

/**
 * A method to clear all redis cache.
 *
 * Handy for releasing on Heroku.
 *
 */
export const emptyAllCaches = () => {
  return new Promise((resolve, reject) => {
    redisClient.flushdb((err, res) => {
      if (err) return reject(err);
      return resolve(res);
    });
  });
};
