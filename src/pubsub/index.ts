require('dotenv').config();
import ioredis from 'ioredis';

const redisClientPub = new ioredis(process.env.REDIS_URL);
const redisClientSub = new ioredis(process.env.REDIS_URL);

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

export { redisClientSub, redisClientPub };
