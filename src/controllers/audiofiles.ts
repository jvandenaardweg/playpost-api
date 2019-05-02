import { Request, Response } from 'express';
import { getRepository, } from 'typeorm';
import joi from 'joi';
import uuid from 'uuid';
import * as Sentry from '@sentry/node';

import { Audiofile, AudiofileMimeType } from '../database/entities/audiofile';
import { Article } from '../database/entities/article';
import { Voice } from '../database/entities/voice';

import { audiofileInputValidationSchema } from '../database/validators';
import { synthesizeArticleToAudiofile } from '../synthesizers';
import { updateArticleToFull } from '../controllers/articles';

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

export const createAudiofile = async (req: Request, res: Response) => {
  interface RequestBody {
    mimeType: AudiofileMimeType;
    voiceId: string;
  }

  interface RequestParams {
    articleId: string;
  }

  const hrstart = process.hrtime();

  let article: Article = null;

  const userId = req.user.id;
  const { articleId } = req.params as RequestParams;
  const { mimeType, voiceId } = req.body as RequestBody;

  const articleRepository = getRepository(Article);
  const voiceRepository = getRepository(Voice);
  const audiofileRepository = getRepository(Audiofile);

  const { error } = joi.validate({ articleId, userId, voiceId, mimeType }, audiofileInputValidationSchema.requiredKeys('articleId', 'userId', 'voiceId', 'mimeType'));

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.withScope((scope) => {
      scope.setExtra('userId', userId);
      scope.setExtra('articleId', articleId);
      scope.setExtra('mimeType', mimeType);
      scope.setExtra('voiceId', voiceId);
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    return res.status(400).json({ message });
  }

  // Fetch the article with the SSML column (which is hidden by default)
  article = await articleRepository.findOne(articleId, { relations: ['audiofiles'], select: ['ssml'] });

  if (!article) {
    const message = 'Article does not exist.';

    Sentry.withScope((scope) => {
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    return res.status(400).json({ message });
  }

  if (article.languageCode !== 'en') {
    const message = `We currently only handle English articles. Your article seems to have the language: ${article.languageCode}`;

    Sentry.withScope((scope) => {
      scope.setExtra('userId', userId);
      scope.setExtra('articleId', articleId);
      scope.setExtra('languageCode', article.languageCode);
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    return res.status(400).json({ message });
  }

  // If there is not SSML data, try to generate it on-demand
  // Usually the SSML data is generated after insertion of an article in the database
  // But if for some reason that didn't work, try it again here.
  if (!article.ssml) {
    try {
      // Fetch the full article details
      await updateArticleToFull(articleId);

      // Get the updated article with the SSML column
      article = await articleRepository.findOne(articleId, { relations: ['audiofiles'], select: ['ssml'] });
    } catch (err) {
      const message = 'Could not update the article to include SSML data. We cannot generate an audiofile.';

      Sentry.withScope((scope) => {
        scope.setExtra('userId', userId);
        scope.setExtra('articleId', articleId);
        Sentry.captureMessage(message, Sentry.Severity.Info);
      });

      return res.status(400).json({ message });
    }
  }

  if (!article.ssml) {
    const message = 'Article has no SSML data. We cannot generate an audiofile.';

    Sentry.withScope((scope) => {
      scope.setExtra('userId', userId);
      scope.setExtra('articleId', articleId);
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

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

    return res.status(400).json({ message, id: article.audiofiles[0].id });
  }

  // Get the voice
  const voice = await voiceRepository.findOne(voiceId);

  if (!voice) {
    const message = 'The given voice to be used to create the audio cannot be found.';

    Sentry.withScope((scope) => {
      scope.setExtra('userId', userId);
      scope.setExtra('articleId', articleId);
      scope.setExtra('voiceId', voiceId);
      Sentry.captureMessage(message, Sentry.Severity.Info);
    });

    return res.status(400).json({ message });
  }

  // Manually generate a UUID.
  // So we can use this ID to upload a file to storage, before we insert it into the database.
  const audiofileId = uuid.v4();

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

  // Synthesize and return an uploaded audiofile for use to use in the database
  const audiofileToCreate = await synthesizeArticleToAudiofile(voice, article, audiofile, mimeType);

  // Then save it in the database
  const createdAudiofile = await audiofileRepository.save(audiofileToCreate);

  console.log('Created audiofile: ', createdAudiofile.id);

  const hrend = process.hrtime(hrstart);
  console.info('Execution time (hr) of createAudiofile(): %ds %dms', hrend[0], hrend[1] / 1000000);

  return res.json(createdAudiofile);
};

/**
 * Gets all the audiofiles from the database.
 * This endpoint is not visible for other users.
 */
export const getAll = async (req: Request, res: Response) => {
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

  const audiofile = await audiofileRepository.findOne(audiofileId);

  if (!audiofile) return res.status(400).json({ message: 'Audiofile not found.' });

  await audiofileRepository.remove(audiofile);

  return res.json({ message: 'Audiofile is deleted!' });
};
