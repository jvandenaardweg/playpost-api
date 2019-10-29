// tslint:disable-next-line
const { version } = require('../../package.json');

import { Request, Response } from 'express';
import nodeFetch from 'node-fetch';
import { getRepository } from 'typeorm';

import { redisClient } from '../cache';
import { Language } from '../database/entities/language';
import { AwsSynthesizer } from '../synthesizers/aws';
import { GoogleSynthesizer } from '../synthesizers/google';

export const getHealthStatus = async (req: Request, res: Response) => {
  let crawlerStatus = 'fail';
  let crawlerMessage = '';
  let googleTTSStatus = 'fail';
  let googleTTSMessage = '';
  let awsPollyStatus = 'fail';
  let awsPollyMessage = '';
  let databaseStatus = 'fail';
  let databaseMessage = '';
  let redisStatus = 'fail';
  let redisMessage = '';

  // TODO: check pubsub status

  try {
    const googleSynthesizer = new GoogleSynthesizer();
    const voices = await googleSynthesizer.getAllVoices();

    if (voices.length) {
      googleTTSStatus = 'ok'
    } else {
      googleTTSMessage = 'Did not get the available voices'
    }
  } catch (err) {
    googleTTSStatus = 'fail';
    googleTTSMessage = err
  }

  try {
    const awsSynthesizer = new AwsSynthesizer();
    const voices = await awsSynthesizer.getAllVoices();

    if (voices.length) {
      awsPollyStatus = 'ok'
    } else {
      awsPollyMessage = 'Did not get the available voices'
    }
  } catch (err) {
    awsPollyStatus = 'fail';
    awsPollyMessage = err
  }

  // Check if crawler is reachable
  try {
    // TODO: check response time
    const responseOk = await nodeFetch(`${process.env.CRAWLER_BASE_URL}/status`, { method: 'head' }).then((response) => response.ok);
    if (responseOk) {
      crawlerStatus = 'ok';
    } else {
      crawlerMessage = 'Reponse not OK';
    }
  } catch (err) {
    crawlerStatus = 'fail';
    crawlerMessage = err;
  }

  // Check if database connection is up
  try {
    // TODO: check response time
    await getRepository(Language).findOneOrFail({ name: 'English' });
    databaseStatus = 'ok';
  } catch (err) {
    databaseStatus = 'fail';
    databaseMessage = err;
  }

  // Check if redis connection is up
  try {
    // TODO: check response time
    const redisClientStatus = redisClient.status

    if (redisClientStatus === 'ready') {
      redisStatus = 'ok';
    } else {
      redisMessage = 'Redis client did not return "ready".';
    }
  } catch (err) {
    redisStatus = 'fail';
    redisMessage = err;
  }

  // Database and Redis status is only important for the API to be up
  // The crawler is an external service, which could be up or down when deploying
  const status = databaseStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'fail';
  const statusCode = (status === 'ok') ? 200 : 503; // 503 = Service Unavailable

  return res.status(statusCode).json({
    status,
    apiVersion: version,
    services: {
      database: databaseStatus,
      redis: redisStatus,
      crawler: crawlerStatus,
      googleTTS: googleTTSStatus,
      awsPolly: awsPollyStatus
    },
    messages: {
      database: databaseMessage,
      redis: redisMessage,
      crawler: crawlerMessage,
      googleTTS: googleTTSMessage,
      awsPolly: awsPollyMessage
    }
  });
};
