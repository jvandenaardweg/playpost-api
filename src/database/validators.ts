import joi from 'joi';
import { join } from 'path';

export const articleInputValidationSchema = joi.object().keys({
  articleUrl: joi.string().uri()
});

export const audiofileInputValidationSchema = joi.object().keys({
  userId: joi.string().uuid(),
  playlistId: joi.string().uuid(),
  articleId: joi.string().uuid(),
  name: joi.string(),
  articleUrl: joi.string().uri(),
  audiofileId: joi.string().uuid()
});

export const playlistInputValidationSchema = joi.object().keys({
  userId: joi.string().uuid(),
  playlistId: joi.string().uuid(),
  articleId: joi.string().uuid(),
  name: joi.string(),
  articleUrl: joi.string().uri(),
  encoding: joi.any().valid('MP3', 'OGG_OPUS')
});

export const userInputValidationSchema = joi.object().keys({
  id: joi.string().uuid(),
  userId: joi.string().uuid(),
  email: joi.string().email({ minDomainAtoms: 2 }),
  password: joi.string(),
});
