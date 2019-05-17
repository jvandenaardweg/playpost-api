import { Request, Response } from 'express';
import { getRepository, } from 'typeorm';
import joi from 'joi';
import uuid from 'uuid';
import * as Sentry from '@sentry/node';

import * as storage from '../storage/google-cloud';

import { Audiofile, AudiofileMimeType } from '../database/entities/audiofile';
import { Article, ArticleStatus } from '../database/entities/article';
import { Voice } from '../database/entities/voice';

import { audiofileInputValidationSchema } from '../database/validators';
import { synthesizeArticleToAudiofile } from '../synthesizers';
import { logger } from '../utils';
import { UserVoiceSetting } from '../database/entities/user-voice-setting';

export const findById = async (req: Request, res: Response) => {
  const { audiofileId } = req.params;
  const audiofileRepository = getRepository(Audiofile);
  const { error } = joi.validate({ audiofileId }, audiofileInputValidationSchema.requiredKeys('audiofileId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const audiofile = await audiofileRepository.findOne(audiofileId, { relations: ['voice'] });

  if (!audiofile) return res.status(400).json({ message: 'Audiofile not found.' });

  return res.json(audiofile);
};

/**
 * Create's an audiofile using the article's SSML.
 *
 */
export const createAudiofile = async (req: Request, res: Response) => {
  interface RequestBody {
    mimeType: AudiofileMimeType;
    voiceId: string;
  }

  interface RequestParams {
    articleId: string;
  }

  const hrstart = process.hrtime();

  const loggerPrefix = 'Create Audiofile:';

  let article: Article | undefined;

  const userId = req.user.id;
  const { articleId } = req.params as RequestParams;
  const { mimeType } = req.body as RequestBody;

  const articleRepository = getRepository(Article);
  const voiceRepository = getRepository(Voice);
  const audiofileRepository = getRepository(Audiofile);
  const userVoiceSettingRepository = getRepository(UserVoiceSetting);

  const { error } = joi.validate({ articleId, userId, mimeType }, audiofileInputValidationSchema.requiredKeys('articleId', 'userId', 'mimeType'));

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.withScope((scope) => {
      scope.setExtra('userId', userId);
      scope.setExtra('articleId', articleId);
      scope.setExtra('mimeType', mimeType);
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Fetch the article (with SSML)
  article = await articleRepository.findOne(articleId, { relations: ['audiofiles'] });

  // Check if article exists
  if (!article) {
    const message = 'Article does not exist, cannot create audio.';

    Sentry.withScope((scope) => {
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Check if article status is correct to create audiofiles for
  if (article.status !== ArticleStatus.FINISHED) {
    const message = `The given article is not processed successfully. Current status: ${article.status}. We cannot generate audio for this article.`;

    Sentry.withScope((scope) => {
      scope.setExtra('userId', userId);
      scope.setExtra('articleId', articleId);
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // If the readingTime is greater then 30 minutes (1800 seconds)
  // We just shown an error we cannot create audio for this
  const readingTimeLimit = (30 * 60); // 30 minutes, 1800 seconds
  if (article.readingTime > readingTimeLimit) {
    const message = `The article is longer then ${readingTimeLimit} minutes, which is our limit according to our Terms of Use. We do not create an audiofile for articles longer then ${readingTimeLimit} minutes. Please contact us at info@playpost.app if you want this limit to be removed for you.`;

    Sentry.withScope((scope) => {
      scope.setExtra('userId', userId);
      scope.setExtra('articleId', articleId);
      scope.setExtra('readingTime', article && article.readingTime);
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Check if the language is supported
  const articleLanguage = article && article.language;
  const articleLanguageCode = articleLanguage && articleLanguage.languageCode;

  if (articleLanguageCode !== 'en') {
    const message = `We currently only handle English articles. Your article seems to have the language: ${articleLanguageCode}`;

    Sentry.withScope((scope) => {
      scope.setExtra('userId', userId);
      scope.setExtra('articleId', articleId);
      scope.setExtra('languageCode', articleLanguageCode);
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Check if the article has any SSML
  if (!article.ssml) {
    const message = 'Article has no SSML data. We cannot generate audio for this article.';

    Sentry.withScope((scope) => {
      scope.setExtra('userId', userId);
      scope.setExtra('articleId', articleId);
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // For now, only allow one audiofile
  if (article.audiofiles.length) {
    const message = 'Audiofile for this article already exists. In this version we only allow one audio per article.';

    Sentry.withScope((scope) => {
      scope.setExtra('userId', userId);
      scope.setExtra('articleId', articleId);
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message, id: article.audiofiles[0].id });
  }

  logger.info(loggerPrefix, 'Determining what voice to use for this article...');

  if (!articleLanguageCode) {
    const errorMessage = `Could not determine the language using article language code: ${articleLanguageCode}`;
    logger.error(loggerPrefix, errorMessage);
    return res.status(400).json({ message: errorMessage });
  }

  // Check if the user has a voice set for this article's language
  const userVoiceSetting = await userVoiceSettingRepository.findOne({
    user: {
      id: userId
    },
    language: {
      id: articleLanguage.id
    }
  });

  let voice = userVoiceSetting && userVoiceSetting.voice;

  // Check if the voice or language is active
  // We only create audiofiles for languages and voices that are active
  if (userVoiceSetting && (!userVoiceSetting.voice.isActive || !userVoiceSetting.language.isActive)) {
    const errorMessage = 'The chosen voice or voice language is not active. We cannot create audio for this.';
    logger.error(loggerPrefix, errorMessage);
    return res.status(400).json({ message: errorMessage });
  }

  // If there's no voice set, get the default voice for this language
  if (!userVoiceSetting) {
    logger.info(loggerPrefix, 'User has no voice set for this language, we fallback to the default one...');

    // Get the default voice for the language
    voice = await voiceRepository.findOne({
      isLanguageDefault: true,
      isActive: true,
      language: {
        id: articleLanguage.id
      }
    });

    if (!voice) {
      const errorMessage = `Could not get the active default voice for language: ${articleLanguageCode}`;
      logger.error(loggerPrefix, errorMessage);
      return res.status(400).json({ message: errorMessage });
    }
  }

  if (!voice) {
    const message = 'The given voice to be used to create the audio cannot be found.';

    Sentry.withScope((scope) => {
      scope.setExtra('userId', userId);
      scope.setExtra('articleId', articleId);
      scope.setExtra('voiceId', voice && voice.id);
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  logger.info(loggerPrefix, 'Using voice:', voice.id);

  // Manually generate a UUID.
  // So we can use this ID to upload a file to storage, before we insert it into the database.
  const audiofileId = uuid.v4();

  logger.info(loggerPrefix, 'Creating audiofile placeholder...');

  // Prepare the audiofile
  const audiofile = await audiofileRepository.create({
    id: audiofileId,
    article: {
      id: articleId
    },
    user: {
      id: userId
    },
    voice: {
      id: voice.id
    }
  });

  logger.info(loggerPrefix, `Created audiofile placeholder using ID: ${audiofile.id}`);

  logger.info(loggerPrefix, 'Now synthesizing the article\'s SSML...');

  // // Synthesize and return an uploaded audiofile for use to use in the database
  const audiofileToCreate = await synthesizeArticleToAudiofile(voice, article, audiofile, mimeType);

  logger.info(loggerPrefix, 'Successfully synthesized the article\'s SSML!');

  logger.info(loggerPrefix, 'Saving the audiofile in the database...');

  // Then save it in the database
  const createdAudiofile = await audiofileRepository.save(audiofileToCreate);

  logger.info(loggerPrefix, 'Saved the audiofile in the database! Audiofile ID:', createdAudiofile.id);

  const hrend = process.hrtime(hrstart);
  const ds = hrend[0];
  const dms = hrend[1] / 1000000;
  logger.info(loggerPrefix, `Execution time: ${ds} ${dms}ms`);

  return res.json(createdAudiofile);
};

/**
 * Gets all the audiofiles from the database.
 * This endpoint is not visible for other users.
 */
export const findAllAudiofiles = async (req: Request, res: Response) => {
  const userEmail = req.user.email;
  const audiofileRepository = getRepository(Audiofile);

  if (userEmail !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: 'You dont have access to this endpoint.' });

  const audiofiles = await audiofileRepository.findAndCount();

  return res.json(audiofiles);
};

/**
 * Get's an audiofile out of the database using an URL parameter
 */
export const findAudiofileById = async (req: Request, res: Response) => {
  const { audiofileId } = req.params;
  const audiofileRepository = getRepository(Audiofile);

  const { error } = joi.validate({ audiofileId }, audiofileInputValidationSchema.requiredKeys('audiofileId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const audiofile = await audiofileRepository.findOne(audiofileId);

  if (!audiofile) return res.status(400).json({ message: 'Audiofile not found.' });

  return res.json(audiofile);
};

/**
 * Deletes an article from the database.
 * Also deletes the audiofile from our cloud storage using AfterRemove on the Audiofile entity.
 */
export const deleteById = async (req: Request, res: Response) => {
  const userEmail = req.user.email;
  const { audiofileId } = req.params;
  const audiofileRepository = getRepository(Audiofile);

  if (userEmail !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: 'You dont have access to this endpoint.' });

  const audiofile = await audiofileRepository.findOne(audiofileId, { relations: ['article'] });

  if (!audiofile) return res.status(400).json({ message: 'Audiofile not found.' });

  const articleId = audiofile.article.id;

  // Delete from the database
  await audiofileRepository.remove(audiofile);

  // Delete audiofile from our storage
  await storage.deleteAudiofile(articleId, audiofileId);

  return res.json({ message: 'Audiofile is deleted!' });
};
