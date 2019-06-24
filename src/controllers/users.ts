import { Request, Response } from 'express';
import { getRepository, getConnection } from 'typeorm';
import { User } from '../database/entities/user';
import { userInputValidationSchema } from '../database/validators';
import { validateInput } from '../validators/entity';
import * as cacheKeys from '../cache/keys';
import { routeIsProtected } from './auth';
import joi from 'joi';

const MESSAGE_USER_EMAIL_EXISTS = 'E-mail address already exists.';
const MESSAGE_USER_NOT_FOUND = 'No user found';
const MESSAGE_USER_DELETED = 'User is deleted! This cannot be undone.';
const MESSAGE_USER_NOT_ALLOWED = 'You are not allowed to do this.';

export const createUser = [
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const userRepository = getRepository(User);

    const { error } = joi.validate(req.body, userInputValidationSchema.requiredKeys('email', 'password'));

    if (error) {
      const messageDetails = error.details.map(detail => detail.message).join(' and ');
      return res.status(400).json({ message: messageDetails });
    }

    const emailAddressNormalized = User.normalizeEmail(email);
    const existingUser = await userRepository.findOne({ email: emailAddressNormalized });

    if (existingUser) return res.status(400).json({ message: MESSAGE_USER_EMAIL_EXISTS });

    const hashedPassword = await User.hashPassword(password);

    const userToCreate = { email: emailAddressNormalized, password: hashedPassword };

    // Validate the input
    const validationResult = await validateInput(User, userToCreate);
    if (validationResult.errors.length) return res.status(400).json(validationResult);

    // Create the user
    // We have to use .create followed by .save, so we can use the afterInsert methods on the entity
    const newUserToSave = await userRepository.create(userToCreate);
    const createdUser = await userRepository.save(newUserToSave);

    // Get the created user and return it
    // Important: don't return the createdUser, as this contains the hashed password
    // Our findOne method exclude sensitive fields, like the password
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

    // Remove the JWT verification cache for faster API responses
    const cache = await getConnection('default').queryResultCache;
    if (cache) await cache.remove([cacheKeys.jwtVerifyUser(userId)]);

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
