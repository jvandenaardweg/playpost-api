import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import joi from 'joi';
import { User } from '../database/entities/user';
import { userInputValidationSchema } from '../database/validators';
import { hashPassword } from './auth';

const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is (already) deleted.';
const MESSAGE_ME_DELETED = 'Your account is deleted. This cannot be undone.';

export const findCurrentUser = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRepository = getRepository(User);

  const user = await userRepository.findOne(userId);

  if (!user) return res.status(400).json({ message: MESSAGE_ME_NOT_FOUND });

  return res.json(user);
};

export const updateEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  const userId = req.user.id;
  const userRepository = getRepository(User);

  const { error } = joi.validate({ email, userId }, userInputValidationSchema.requiredKeys('email', 'userId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  await userRepository.update(userId, { email });

  const updatedUser = await userRepository.findOne(userId);

  return res.json(updatedUser);
};

export const updatePassword = async (req: Request, res: Response) => {
  const { password } = req.body;
  const userId = req.user.id;
  const userRepository = getRepository(User);

  const { error } = joi.validate({ password, userId }, userInputValidationSchema.requiredKeys('password', 'userId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const hashedPassword = await hashPassword(password);

  await userRepository.update(userId, { password: hashedPassword });

  const updatedUser = await userRepository.findOne(userId);

  return res.json(updatedUser);
};

export const deleteCurrentUser = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRepository = getRepository(User);

  const { error } = joi.validate({ userId }, userInputValidationSchema.requiredKeys('userId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const user = await userRepository.findOne(userId);

  if (!user) return res.status(400).json({ message: 'User not found!' });

  await userRepository.remove(user);

  return res.json({ message: MESSAGE_ME_DELETED });
};
