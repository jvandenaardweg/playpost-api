import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import passport from 'passport';
import { User } from '../database/entities/user';
import { userInputValidationSchema } from '../database/validators';
import joi from 'joi';
import { logger } from '../utils';

const MESSAGE_AUTH_USER_NOT_FOUND = 'No user found or password is incorrect.';
const MESSAGE_AUTH_PASSWORD_INCORRECT = 'Password is incorrect.';

/**
 * Uses the "email" address and "password" of a user to return an token.
 * The user can use that token to authenticate with our API.
 */
export const getAuthenticationToken = async (req: Request, res: Response) => {
  const loggerPrefix = 'Get Authentication Token: ';
  const { email, password } = req.body;
  const { error } = joi.validate(req.body, userInputValidationSchema.requiredKeys('email', 'password'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    logger.error(loggerPrefix, messageDetails);
    return res.status(400).json({ message: messageDetails });
  }

  logger.info(loggerPrefix, 'Starting...');

  const userRepository = getRepository(User);

  const emailAddressNormalized = User.normalizeEmail(email);;
  const user = await userRepository.findOne({ email: emailAddressNormalized }, { select: ['id', 'email', 'password'] });

  if (!user) {
    logger.error(loggerPrefix, MESSAGE_AUTH_USER_NOT_FOUND);
    return res.status(400).json({ message: MESSAGE_AUTH_USER_NOT_FOUND });
  }

  const isValidPassword = await User.comparePassword(password, user.password);

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
  const token = User.generateJWTToken(user.id);

  logger.info(loggerPrefix, `Generated token using user ID "${user.id}" and user email "${user.email}".`);

  return res.json({ token });
};

export const routeIsProtected = passport.authenticate('jwt', { session: false, failWithError: true });
