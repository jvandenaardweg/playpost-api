import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../database/entities/user';
import { hashPassword } from './auth';

const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is (already) deleted.';
const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';
const MESSAGE_ME_PASSWORD_REQUIRED = 'Password is required.';
const MESSAGE_ME_DELETED = 'Your account is deleted. This cannot be undone.';

export const findCurrentUser = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRepository = getRepository(User);

  const user = await userRepository.findOne(userId);

  if (!user) return res.status(400).json({ message: MESSAGE_ME_NOT_FOUND });

  return res.json(user);
};

export const findAllPlaylists = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRepository = getRepository(User);

  const { playlists } = await userRepository.findOne(userId, { relations: ['playlists'] });

  return res.json(playlists);
};

export const findAllArticles = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRepository = getRepository(User);

  const { articles } = await userRepository.findOne(userId, { relations: ['articles'] });

  return res.json(articles);
};

export const findAllAudiofiles = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRepository = getRepository(User);

  const { audiofiles } = await userRepository.findOne(userId, { relations: ['audiofiles'] });

  return res.json(audiofiles);
};

export const updateEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  const userId = req.user.id;
  const userRepository = getRepository(User);

  if (!email) return res.status(400).json({ message: MESSAGE_ME_EMAIL_REQUIRED });

  await userRepository.update(userId, { email });

  const updatedUser = await userRepository.findOne(userId);

  return res.json(updatedUser);
};

export const updatePassword = async (req: Request, res: Response) => {
  const { password } = req.body;
  const userId = req.user.id;

  const userRepository = getRepository(User);

  if (!password) return res.status(400).json({ message: MESSAGE_ME_PASSWORD_REQUIRED });

  const hashedPassword = await hashPassword(password);

  await userRepository.update(userId, { password: hashedPassword });

  const updatedUser = await userRepository.findOne(userId);

  return res.json(updatedUser);
};

export const deleteCurrentUser = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRepository = getRepository(User);

  const user = await userRepository.findOne(userId);

  await userRepository.remove(user);

  return res.json({ message: MESSAGE_ME_DELETED });
};
