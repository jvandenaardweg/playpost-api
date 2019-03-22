require('dotenv').config();
import IORedis from 'ioredis';
import ExpressBruteRedis from 'express-brute-redis';
import RateLimitRedis from 'rate-limit-redis';

const redisClient = new IORedis(process.env.REDIS_URL);
const redisClientPub = new IORedis(process.env.REDIS_URL);
const redisClientSub = new IORedis(process.env.REDIS_URL);
const expressBruteRedisStore = new ExpressBruteRedis({ url: process.env.REDIS_URL });
const expressRateLimitRedisStore = new RateLimitRedis({
  client: redisClient
});

// Subscriber client, listening for messages
redisClientSub.on('ready', () => {
  console.log('Redis Client Sub:', 'Connection successful!');
  redisClientSub.subscribe('FETCH_FULL_ARTICLE');
});
redisClientSub.on('error', (error) => {
  console.log('Redis Client Sub:', 'Error', error.code, error.message);
});

redisClientSub.on('reconnecting', () => {
  console.log('Redis Client Sub:', 'Reconnecting...');
});

redisClientSub.on('close', () => {
  console.log('Redis Client Sub:', 'Connection closed.');
});

redisClientSub.on('end', () => {
  console.log('Redis Client Sub:', 'End.');
});

// Publisher client, publishing messages
redisClientPub.on('ready', () => {
  console.log('Redis Client Pub:', 'Connection successful!');
});
redisClientPub.on('error', (error) => {
  console.log('Redis Client Pub:', 'Error', error.code, error.message);
});

redisClientPub.on('reconnecting', () => {
  console.log('Redis Client Pub:', 'Reconnecting...');
});

redisClientPub.on('close', () => {
  console.log('Redis Client Pub:', 'Connection closed.');
});

redisClientPub.on('end', () => {
  console.log('Redis Client Pub:', 'End.');
});

export { redisClientSub, redisClientPub, redisClient, expressBruteRedisStore, expressRateLimitRedisStore };
