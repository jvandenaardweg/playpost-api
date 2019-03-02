import { Request, Response } from 'express';
import { getRepository, } from 'typeorm';
import { Audiofile } from '../database/entities/audiofile';
import { synthesizeArticleToAudiofile } from '../synthesizers';
import { Article } from '../database/entities/article';
import uuid from 'uuid';

export const findById = async (req: Request, res: Response) => {
  const { audiofileId } = req.params;
  const audiofileRepository = getRepository(Audiofile);

  if (!audiofileId) return res.status(400).json({ message: 'Please give an audiofile ID.' });

  const audiofile = await audiofileRepository.findOne(audiofileId);

  if (!audiofile) return res.status(404).json({ message: 'Audiofile not found.' });

  return res.json(audiofile);
};

export const createAudiofile = async (req: Request, res: Response) => {
  const { articleId } = req.params;
  const articleRepository = getRepository(Article);
  const audiofileRepository = getRepository(Audiofile);

  if (!articleId) return res.status(400).json({ message: 'Please give a articleId param.' });

  const article: Article = await articleRepository.findOne(articleId, { relations: ['audiofiles'] });

  if (!article) return res.status(400).json({ message: 'Article does not exist.' });

  if (!article.ssml) return res.status(400).json({ message: 'Article has no SSML data. We cannot generate an audiofile.' });

  // For now, only allow one audiofile
  if (article.audiofiles.length) return res.status(400).json({ message: 'Audiofile for this article already exists.', id: article.audiofiles[0].id });

  // Manually generate a UUID.
  // So we can use this ID to upload a file to storage, before we insert it into the database.
  const audiofileId = uuid.v4();

  // Prepare the audiofile
  const audiofile = await audiofileRepository.create({
    id: audiofileId,
    article: {
      id: articleId
    }
  });

  // Synthesize and return an uploaded audiofile for use to use in the database
  const audiofileToCreate: Audiofile = await synthesizeArticleToAudiofile(article, audiofile);

  // Then save it in the database
  const createdAudiofile = await audiofileRepository.save(audiofileToCreate);

  console.log('Created audiofile: ', createdAudiofile);

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

  if (!audiofileId) return res.status(400).json({ message: 'The audiofile ID is required.' });

  const audiofile = await audiofileRepository.findOne(audiofileId);

  if (!audiofile) return res.status(404).json({ message: 'Audiofile not found.' });

  return res.json(audiofile);
};

/**
 * Deletes an article from the database.
 * Also deletes the audiofile from our cloud storage using AfterRemove on the Audiofile entity.
 */
export const deleteById = async (req: Request, res: Response) => {
  const { email } = req.user;
  const { audiofileId } = req.params;
  const audiofileRepository = getRepository(Audiofile);

  if (email !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: 'You dont have access to this endpoint.' });

  const audiofile = await audiofileRepository.findOne(audiofileId);

  if (!audiofile) return res.status(404).json({ message: 'Audiofile not found.' });

  await audiofileRepository.remove(audiofile);

  return res.json({ message: 'Audiofile is deleted!' });
};
