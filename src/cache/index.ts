require('dotenv').config();
import IORedis from 'ioredis';
import RateLimitRedis from 'rate-limit-redis';

export const redisClient = new IORedis(process.env.REDIS_URL);

export const expressRateLimitRedisStore = new RateLimitRedis({
  client: redisClient
});
