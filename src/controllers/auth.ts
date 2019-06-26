import { Request, Response } from 'express';
import { getRepository, getCustomRepository } from 'typeorm';
import passport from 'passport';
import { User } from '../database/entities/user';
import { userInputValidationSchema } from '../database/validators';
import joi from 'joi';
import { logger } from '../utils';
import { UserRepository } from '../database/repositories/user';
import * as AWSSes from '../mailers/aws-ses';
import { Sentry } from '../error-reporter';

const MESSAGE_AUTH_USER_NOT_FOUND = 'No user found or password is incorrect.';
const MESSAGE_AUTH_PASSWORD_INCORRECT = 'Password is incorrect.';

export const routeIsProtected = passport.authenticate('jwt', { session: false, failWithError: true });

/**
 * Uses the "email" address and "password" of a user to return an token.
 * The user can use that token to authenticate with our API.
 *
 * This route is protected by Express Brute.
 *
 * Public method. No need to be authenticated.
 *
 * @param req
 * @param res
 */
export const getAuthenticationToken = async (req: Request, res: Response) => {
  const loggerPrefix = 'Get Authentication Token: ';
  const { email, password } = req.body;
  const { error } = joi.validate(req.body, userInputValidationSchema.requiredKeys('email', 'password'));

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.configureScope((scope) => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  logger.info(loggerPrefix, 'Starting...');

  const userRepository = getRepository(User);

  const emailAddressNormalized = User.normalizeEmail(email);
  const user = await userRepository.findOne({ email: emailAddressNormalized }, { select: ['id', 'email', 'password'] });

  if (!user) {
    Sentry.configureScope((scope) => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(MESSAGE_AUTH_USER_NOT_FOUND);
    });

    logger.error(loggerPrefix, MESSAGE_AUTH_USER_NOT_FOUND);

    return res.status(400).json({ message: MESSAGE_AUTH_USER_NOT_FOUND });
  }

  const isValidPassword = await User.comparePassword(password, user.password);

  // TODO: Log tries for security
  if (!isValidPassword) {
    Sentry.configureScope((scope) => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setUser(user);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(MESSAGE_AUTH_PASSWORD_INCORRECT);
    });

    logger.error(loggerPrefix, MESSAGE_AUTH_PASSWORD_INCORRECT);

    return res.status(400).json({ message: MESSAGE_AUTH_PASSWORD_INCORRECT });
  }

  logger.info(loggerPrefix, 'Password is valid!');

  // Set a date to remember when the user last logged in
  // Because a login is successfull, we can also remove the resetPasswordToken if it exists. It's not needed anymore.
  await userRepository.update(user.id, { authenticatedAt: new Date(), resetPasswordToken: undefined });

  logger.info(loggerPrefix, 'authenticatedAt date is updated!');

  // We use the e-mail in the token as an extra way to get some easy context during debugging
  // For example, we can use the email in Sentry to maybe contact the user
  const token = User.generateJWTAccessToken(user.id, user.email);
  const decoded = User.verifyJWTAccessToken(token);

  // Decode for extra info about the token
  const expiresAt = (decoded && decoded['exp']) ? new Date(decoded['exp'] * 1000).toISOString() : null;
  const expiresAtMs = (decoded && decoded['exp']) ? new Date(decoded['exp'] * 1000).getTime() : null;
  const issuedAt = (decoded && decoded['iat']) ? new Date(decoded['iat'] * 1000).toISOString() : null;
  const issuedAtMs = (decoded && decoded['iat']) ? new Date(decoded['iat'] * 1000).getTime() : null;

  logger.info(loggerPrefix, `Generated token using user ID "${user.id}" and user email "${user.email}".`);

  return res.json({ token, expiresAt, expiresAtMs, issuedAt, issuedAtMs });
};

/**
 * Creates a reset password token to allow an unauthorized user to reset his account's password.
 * The generated token is send to the user his e-mail address and stored in the database.
 * The user can use that token, in combinatation with the /auth/update-password endpoint to reset his password.
 *
 * This route is protected by Express Brute.
 *
 * Public method. No need to be authenticated.
 *
 * @param req
 * @param res
 */
export const getResetPasswordToken = async (req: Request, res: Response) => {
  interface RequestBody {
    email: string;
  }

  const loggerPrefix = 'Get Reset Password Token: ';
  const userRepository = getCustomRepository(UserRepository);

  const { email } = req.body as RequestBody;

  const { error } = joi.validate(req.body, userInputValidationSchema.requiredKeys('email'));

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.withScope((scope) => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  const user = await userRepository.findOne({ email }, { select: ['id', 'email'] });

  if (!user) {
    const message = 'The given e-mail address does not exist. Are you sure you already have an account?';

    Sentry.withScope((scope) => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // User exists, generate a random token
  const resetPasswordToken = User.generateRandomResetPasswordToken();

  await userRepository.update(user.id, { resetPasswordToken, requestResetPasswordAt: new Date() });

  // Important: keep this production URL
  // As iOS universal links pick it up correctly for all other environments
  // Make sure this URL is displaying a fallback
  const resetPasswordUrl = `https://playpost.app/login/reset-password/${resetPasswordToken}`;

  const htmlBody = `
    <h1>Reset your password</h1>
    <p>You have requested to reset your password. You can use the code below to change your password within the Playpost App.</p>
    <p>Your reset password code:<br /><h1><strong>${resetPasswordToken}</strong></h1></p>
    <p><a href="${resetPasswordUrl}">Open in Playpost App</a>
    <br /><br /><br /><br /><br /><br />
    <h3>How to change my password?</h3>
    <p>It's very easy. Click the link above, this will open the Playpost App in the Reset Password screen.</p>
    <h3>How to change my password manually?</h3>
    <p>Below are the manual steps to change your password within the app:</p>
    <ol>
      <li>Open the Playpost App</li>
      <li>Go to the Login screen</li>
      <li>Select "Forgot password"</li>
      <li>Select "Already have reset password code"</li>
      <li>Fill in your Reset password code: ${resetPasswordToken}</li>
      <li>Fill in your new password</li>
      <li>Save your new password and you're done!</li>
    </ol>
    <p>Need more help? E-mail us at info@playpost.app. We are happy to help you!</p>
  `;

  // Send e-mail using AWS SES
  await AWSSes.sendTransactionalEmail(user.email, 'Reset your password', htmlBody);

  return res.json({ message: 'An e-mail is send to your e-mail inbox on how to reset your password.' });
};

/**
 * Updates the user's password using a reset token.
 * This token can be requested if the user has lost his password.
 *
 * This route is protected by Express Brute.
 *
 * Public method. No need to be authenticated.
 *
 * @param req
 * @param res
 */
export const updatePasswordUsingToken = async (req: Request, res: Response) => {
  interface RequestBody {
    resetPasswordToken: string;
    password: string;
  }

  const loggerPrefix = 'Update Password Using Token: ';
  const userRepository = getCustomRepository(UserRepository);

  const { resetPasswordToken, password } = req.body as RequestBody;

  const { error } = joi.validate(req.body, userInputValidationSchema.requiredKeys('resetPasswordToken', 'password'));

  if (error) {
    const message = error.details.map(detail => detail.message).join(' and ');

    Sentry.withScope((scope) => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  const user = await userRepository.findOne({ resetPasswordToken }, { select: ['id', 'resetPasswordToken'] });

  if (!user) {
    const message = `Password reset code "${resetPasswordToken}" could not be found. If you think this is incorrect, try resetting your password again.`;

    Sentry.withScope((scope) => {
      scope.setLevel(Sentry.Severity.Error);
      scope.setExtra('body', req.body);
      scope.setExtra('params', req.params);
      Sentry.captureMessage(message);
    });

    logger.error(loggerPrefix, message);
    return res.status(400).json({ message });
  }

  // Update the password and set the correct date at resetPasswordAt

  const hashedPassword = await User.hashPassword(password);

  await userRepository.update(user.id, {
    password: hashedPassword,
    resetPasswordToken: undefined,
    resetPasswordAt: new Date()
  });

  return res.json({ message: 'Your password is updated. You can now login again.' });
};
