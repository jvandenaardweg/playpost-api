import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import passport from 'passport';
import { User } from '../database/entities/user';
import { userInputValidationSchema } from '../database/validators';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import joi from 'joi';

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) throw new Error('Please set the JWT_SECRET environment variable.');

const MESSAGE_AUTH_USER_NOT_FOUND = 'No user found or password is incorrect.';
const MESSAGE_AUTH_PASSWORD_INCORRECT = 'Password is incorrect.';

/**
 * Uses the "email" address and "password" of a user to return an token.
 * The user can use that token to authenticate with our API.
 */
export const getAuthenticationToken = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const userRepository = getRepository(User);
  const { error } = joi.validate({ email, password }, userInputValidationSchema.requiredKeys('email', 'password'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const user = await userRepository.findOne({ email }, { select: ['id', 'email', 'password'] });

  if (!user) return res.status(400).json({ message: MESSAGE_AUTH_USER_NOT_FOUND });

  const isValidPassword = await comparePassword(password, user.password);

  // TODO: Log tries for security
  if (!isValidPassword) return res.status(400).json({ message: MESSAGE_AUTH_PASSWORD_INCORRECT });

  // Set a date to remember when the user last logged in
  await userRepository.update(user.id, { authenticatedAt: new Date() });

  // We use the e-mail in the token as an extra way to get some easy context during debugging
  // For example, we can use the email in Sentry to maybe contact the user
  const token = generateJWTToken(user.id, user.email);

  return res.json({ token });
};

/**
 * Creates and reurns a JWT token using a user ID and e-mail address.
 */
export const generateJWTToken = (id: string, email: string): string => {
  return jsonwebtoken.sign({ id, email }, JWT_SECRET);
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
