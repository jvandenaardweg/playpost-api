import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import passport from 'passport';
import { User } from '../database/entities/user';
import { userInputValidationSchema } from '../database/validators';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import joi from 'joi';
import { logger } from '../utils';

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) throw new Error('Please set the JWT_SECRET environment variable.');

const MESSAGE_AUTH_USER_NOT_FOUND = 'No user found or password is incorrect.';
const MESSAGE_AUTH_PASSWORD_INCORRECT = 'Password is incorrect.';

/**
 * Uses the "email" address and "password" of a user to return an token.
 * The user can use that token to authenticate with our API.
 */
export const getAuthenticationToken = async (req: Request, res: Response) => {
  const loggerPrefix = 'Get Authentication Token: ';
  const { email, password } = req.body;
  const userRepository = getRepository(User);
  const { error } = joi.validate({ email, password }, userInputValidationSchema.requiredKeys('email', 'password'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    logger.error(loggerPrefix, messageDetails);
    return res.status(400).json({ message: messageDetails });
  }

  logger.info(loggerPrefix, 'Starting...');

  const emailAddressNormalized = email.toLowerCase();
  const user = await userRepository.findOne({ email: emailAddressNormalized }, { select: ['id', 'email', 'password'] });

  if (!user) {
    logger.error(loggerPrefix, MESSAGE_AUTH_USER_NOT_FOUND);
    return res.status(400).json({ message: MESSAGE_AUTH_USER_NOT_FOUND });
  }

  const isValidPassword = await comparePassword(password, user.password);

  // TODO: Log tries for security
  if (!isValidPassword) {
    logger.error(loggerPrefix, MESSAGE_AUTH_PASSWORD_INCORRECT);
    return res.status(400).json({ message: MESSAGE_AUTH_PASSWORD_INCORRECT });
  }

  logger.info(loggerPrefix, 'Password is valid!');

  // Set a date to remember when the user last logged in
  await userRepository.update(user.id, { authenticatedAt: new Date() });

  logger.info(loggerPrefix, 'authenticatedAt date is updated!');

  // We use the e-mail in the token as an extra way to get some easy context during debugging
  // For example, we can use the email in Sentry to maybe contact the user
  const token = generateJWTToken(user.id);

  logger.info(loggerPrefix, `Generated token using user ID "${user.id}" and user email "${user.email}".`);

  return res.json({ token });
};

/**
 * Creates and reurns a JWT token using a user ID and e-mail address.
 */
export const generateJWTToken = (id: string): string => {
  return jsonwebtoken.sign({ id }, JWT_SECRET);
};

/**
 * Takes a plain text password and returns a hash using bcryptjs.
 */
export const hashPassword = (password: string): Promise<string> => {
  return bcryptjs.hash(password, 10);
};

/**
 * Compares a plain text password with a hashed one. Returns true if they match.
 */
export const comparePassword = (password: string, hashedPassword: string) => {
  return bcryptjs.compare(password, hashedPassword);
};

export const routeIsProtected = passport.authenticate('jwt', { session: false, failWithError: true });
