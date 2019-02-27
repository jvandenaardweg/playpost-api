import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entities/user';
import { validateInput } from '../validators/entity';
import { generateJWTToken, hashPassword } from './auth';

const MESSAGE_USER_EMAIL_PASSWORD_REQUIRED = 'No e-mail and or password given.';
const MESSAGE_USER_EMAIL_EXISTS = 'E-mail address already exists.';
const MESSAGE_USER_NOT_FOUND = 'No user found';
const MESSAGE_USER_DELETED = 'User is deleted! This cannot be undone.';
const MESSAGE_USER_NOT_ALLOWED = 'You are not allowed to do this.';

export const createUser = async (req: Request, res: Response) => {
  // TODO: validate email, password
  const { email, password } = req.body;
  const userRepository = getRepository(User);

  if (!email && !password) {
    return res.status(400).json({ message: MESSAGE_USER_EMAIL_PASSWORD_REQUIRED });
  }

  const existingUser = await userRepository.findOne({ email });

  if (existingUser) return res.status(400).json({ message: MESSAGE_USER_EMAIL_EXISTS });

  const hashedPassword = await hashPassword(password);

  const userToCreate = { email, password: hashedPassword };

  // Validate the input
  const validationResult = await validateInput(User, userToCreate);
  if (validationResult.errors.length) return res.status(400).json(validationResult);

  // Create the user
  const newUserToSave = await userRepository.create(userToCreate);
  const createdUser = await userRepository.save(newUserToSave);

  // Send a token within a successful signup, so we can log the user in right away
  const token = generateJWTToken(createdUser.id, createdUser.email);

  // TODO: as we return a token here, we should also set "authenticatedAt" date upon a signup?
  return res.json({ token });
};

export const deleteUser = async (req: Request, res: Response) => {
  const { email } = req.user;
  const { userId } = req.params;
  const userRepository = getRepository(User);

  if (email !== 'jordyvandenaardweg@gmail.com') return res.status(401).json({ message: MESSAGE_USER_NOT_ALLOWED });

  const validationResult = await validateInput(User, { id: userId });
  if (validationResult.errors.length) return res.status(400).json(validationResult);

  const userToDelete = await userRepository.findOne({ id: userId });

  if (!userToDelete) return res.status(404).json({ message: MESSAGE_USER_NOT_FOUND });

  await userRepository.remove(userToDelete);

  return res.json({ message: MESSAGE_USER_DELETED });
};

export const findAllUsers = async (req: Request, res: Response) => {
  const userRepository = getRepository(User);

  const users = await userRepository.find();

  return res.json(users);
};
