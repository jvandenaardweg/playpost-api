require('dotenv').config();
import IORedis from 'ioredis';
// import ExpressBruteRedis from 'express-brute-redis';
import RateLimitRedis from 'rate-limit-redis';
import { logger } from '../utils';

const redisClient = new IORedis(process.env.REDIS_URL);
const redisClientPub = new IORedis(process.env.REDIS_URL);
const redisClientSub = new IORedis(process.env.REDIS_URL);
// const expressBruteRedisStore = new ExpressBruteRedis({ url: process.env.REDIS_URL, port: null, host: null, prefix: 'express-brute:' });
const expressRateLimitRedisStore = new RateLimitRedis({
  client: redisClient
});

// Subscriber client, listening for messages
redisClientSub.on('ready', () => {
  logger.info('Redis Client Sub:', 'Connection successful!');

  redisClientSub.subscribe('FETCH_FULL_ARTICLE');
  redisClientSub.subscribe('ADD_TO_MAILCHIMP_LIST');
  redisClientSub.subscribe('REMOVE_FROM_MAILCHIMP_LIST');
});
redisClientSub.on('error', (error) => {
  logger.error('Redis Client Sub:', 'Error', error.code, error.message);
});

redisClientSub.on('reconnecting', () => {
  logger.info('Redis Client Sub:', 'Reconnecting...');
});

redisClientSub.on('close', () => {
  logger.info('Redis Client Sub:', 'Connection closed.');
});

redisClientSub.on('end', () => {
  logger.info('Redis Client Sub:', 'End.');
});

// Publisher client, publishing messages
redisClientPub.on('ready', () => {
  logger.info('Redis Client Pub:', 'Connection successful!');
});
redisClientPub.on('error', (error) => {
  logger.error('Redis Client Pub:', 'Error', error.code, error.message);
});

redisClientPub.on('reconnecting', () => {
  logger.info('Redis Client Pub:', 'Reconnecting...');
});

redisClientPub.on('close', () => {
  logger.info('Redis Client Pub:', 'Connection closed.');
});

redisClientPub.on('end', () => {
  logger.info('Redis Client Pub:', 'End.');
});

export { redisClientSub, redisClientPub, redisClient, expressRateLimitRedisStore };
