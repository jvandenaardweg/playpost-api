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
