import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../database/entities/user';
import { userInputValidationSchema } from '../database/validators';
import { validateInput } from '../validators/entity';
import { hashPassword, routeIsProtected } from './auth';
import joi from 'joi';

const MESSAGE_USER_EMAIL_EXISTS = 'E-mail address already exists.';
const MESSAGE_USER_NOT_FOUND = 'No user found';
const MESSAGE_USER_DELETED = 'User is deleted! This cannot be undone.';
const MESSAGE_USER_NOT_ALLOWED = 'You are not allowed to do this.';

export const createUser = [
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const userRepository = getRepository(User);

    const { error } = joi.validate({ email, password }, userInputValidationSchema.requiredKeys('email', 'password'));

    if (error) {
      const messageDetails = error.details.map(detail => detail.message).join(' and ');
      return res.status(400).json({ message: messageDetails });
    }

    const emailAddressNormalized = email.toLowerCase();
    const existingUser = await userRepository.findOne({ email: emailAddressNormalized });

    if (existingUser) return res.status(400).json({ message: MESSAGE_USER_EMAIL_EXISTS });

    const hashedPassword = await hashPassword(password);

    const userToCreate = { email: emailAddressNormalized, password: hashedPassword };

    // Validate the input
    const validationResult = await validateInput(User, userToCreate);
    if (validationResult.errors.length) return res.status(400).json(validationResult);

    // Create the user
    const newUserToSave = await userRepository.create(userToCreate);
    const createdUser = await userRepository.save(newUserToSave);

    // Get the created user and return it
    const user = await userRepository.findOne(createdUser.id);

    return res.json(user);
  }
];

export const deleteUser = [
  routeIsProtected,
  async (req: Request, res: Response) => {
    const userEmail = req.user.email;
    const { userId } = req.params;
    const userRepository = getRepository(User);

    if (userEmail !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: MESSAGE_USER_NOT_ALLOWED });

    const validationResult = await validateInput(User, { id: userId });
    if (validationResult.errors.length) return res.status(400).json(validationResult);

    const userToDelete = await userRepository.findOne(userId);

    if (!userToDelete) return res.status(400).json({ message: MESSAGE_USER_NOT_FOUND });

    await userRepository.remove(userToDelete);

    return res.json({ message: MESSAGE_USER_DELETED });
  }
];

export const findAllUsers = [
  routeIsProtected,
  async (req: Request, res: Response) => {
    const userEmail = req.user.email;
    const userRepository = getRepository(User);

    if (userEmail !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: 'You dont have access to this endpoint.' });

    const users = await userRepository.find({
      order: {
        createdAt: 'DESC'
      }
    });

    return res.json(users);
  }
];
