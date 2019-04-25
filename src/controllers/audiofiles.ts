import { Request, Response } from 'express';
import { getRepository, } from 'typeorm';
import joi from 'joi';
import uuid from 'uuid';

import { Audiofile, AudiofileEncoding } from '../database/entities/audiofile';
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

  const audiofile = await audiofileRepository.findOne(audiofileId);

  if (!audiofile) return res.status(400).json({ message: 'Audiofile not found.' });

  return res.json(audiofile);
};

export const createAudiofile = async (req: Request, res: Response) => {
  interface RequestBody {
    encoding: AudiofileEncoding;
    voiceId: string;
  }

  interface RequestParams {
    articleId: string;
  }

  const hrstart = process.hrtime();

  let article: Article = null;

  const userId = req.user.id;
  const { articleId } = req.params as RequestParams;
  const { encoding, voiceId } = req.body as RequestBody;

  const articleRepository = getRepository(Article);
  const voiceRepository = getRepository(Voice);
  const audiofileRepository = getRepository(Audiofile);

  const { error } = joi.validate({ articleId, userId, voiceId, encoding }, audiofileInputValidationSchema.requiredKeys('articleId', 'userId', 'voiceId', 'encoding'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  article = await articleRepository.findOne(articleId, { relations: ['audiofiles'] });

  if (!article) return res.status(400).json({ message: 'Article does not exist.' });

  if (article.languageCode !== 'en') return res.status(400).json({ message: `We currently only handle English articles. Your article seems to have the language: ${article.languageCode}` });

  // If there is not SSML data, try to generate it on-demand
  // Usually the SSML data is generated after insertion of an article in the database
  // But if for some reason that didn't work, try it again here.
  if (!article.ssml) {
    try {
      // Fetch the full article details
      await updateArticleToFull(articleId);

      // Get the updated article
      article = await articleRepository.findOne(articleId, { relations: ['audiofiles'] });
    } catch (err) {
      return res.status(400).json({ message: 'Could not update the article to include SSML data. We cannot generate an audiofile.' });
    }
  }

  if (!article.ssml) return res.status(400).json({ message: 'Article has no SSML data. We cannot generate an audiofile.' });

  // For now, only allow one audiofile
  if (article.audiofiles.length) return res.status(400).json({ message: 'Audiofile for this article already exists.', id: article.audiofiles[0].id });

  // Get the voice
  const voice = await voiceRepository.findOne(voiceId);
  if (!voice) return res.status(400).json({ message: 'The given voice to be used to create the audio cannot be found.' });

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
  const audiofileToCreate = await synthesizeArticleToAudiofile(voice, article, audiofile, encoding);

  // Then save it in the database
  const createdAudiofile = await audiofileRepository.save(audiofileToCreate);

  console.log('Created audiofile: ', createdAudiofile);

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
