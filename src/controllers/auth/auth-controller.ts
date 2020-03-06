import joi from '@hapi/joi';
import { Request, Response } from 'express';
import passport from 'passport';

import { User } from '../../database/entities/user';
import * as AWSSes from '../../mailers/aws-ses';
import { logger } from '../../utils';
import { BaseController } from './../index';
import { UserService } from '../../services/user-service';
import { HttpError, HttpStatus } from '../../http-error';
import { PostAuthResponse, PostAuthResetPasswordRequestBody, PatchAuthActivateRequestBody, PostAuthUpdatePasswordMobileRequestBody, PostAuthResetPasswordMobileRequestBody, PostAuthRequestBody } from './types';

export const routeIsProtected = passport.authenticate('jwt', { session: false, failWithError: true });

export class AuthController extends BaseController {
  private readonly usersService: UserService;

  constructor() {
    super();

    this.usersService = new UserService()
  }

  /**
   * @swagger
   *
   *  /auth:
   *    post:
   *      operationId: postAuth
   *      tags:
   *        - auth
   *      summary: Get an authentication token using email and password
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostAuthRequestBody'
   *      responses:
   *        '400':
   *          $ref: '#/components/responses/BadRequestError'
   *        '401':
   *          $ref: '#/components/responses/UnauthorizedError'
   *        '404':
   *          $ref: '#/components/responses/NotFoundError'
   *        '200':
   *          $ref: '#/components/responses/PostAuthResponse'
   */
  public postAuth = async (req: Request, res: Response) => {
    const loggerPrefix = 'Get Authentication Token: ';
    const { email, password } = req.body as PostAuthRequestBody;

    const validationSchema = joi.object().keys({
      email: joi.string().email({ minDomainSegments: 2 }).required(),
      password: joi.string().min(6).required()
    });

    const { error } = validationSchema.validate(req.body);

    if (error) {
      const message = error.details.map(detail => detail.message).join(' and ');

      logger.error(loggerPrefix, message);
      
      throw new HttpError(HttpStatus.BadRequest, message, error.details);
    }

    logger.info(loggerPrefix, 'Starting...');

    const emailAddressNormalized = User.normalizeEmail(email);

    const user = await this.usersService.findOneByEmailWithPassword(emailAddressNormalized);

    if (!user) {
      const errorMessage = 'Sorry, we couldn\'t find an account with that email address.';
      logger.error(loggerPrefix, errorMessage);

      throw new HttpError(HttpStatus.NotFound, errorMessage, { field: 'email' });
    }

    if (!user.password) {
      const errorMessage = 'We could not log you in due to a system password error.';
      logger.error(loggerPrefix, errorMessage);
      
      throw new HttpError(HttpStatus.InternalServerError, errorMessage);
    }

    const isValidPassword = await User.comparePassword(password, user.password);

    // TODO: Log tries for security
    if (!isValidPassword) {
      const errorMessage = 'Sorry, that password isn\'t right.';
      logger.error(loggerPrefix, errorMessage);

      throw new HttpError(HttpStatus.BadRequest, errorMessage, { field: 'password' });
    }

    logger.info(loggerPrefix, 'Password is valid!');

    // Set a date to remember when the user last logged in
    // Because a login is successfull, we can also remove the resetPasswordToken if it exists. It's not needed anymore.
    await this.usersService.updateAuthenticatedAt(user.id, new Date())

    logger.info(loggerPrefix, 'authenticatedAt date is updated!');

    // We use the e-mail in the token as an extra way to get some easy context during debugging
    // For example, we can use the email in Sentry to maybe contact the user
    const token = User.generateJWTAccessToken(user.id, user.email);
    const decoded = User.verifyJWTAccessToken(token);

    // Decode for extra info about the token
    const expiresAt = decoded && decoded['exp'] ? new Date(decoded['exp'] * 1000).toISOString() : null;
    const expiresAtMs = decoded && decoded['exp'] ? new Date(decoded['exp'] * 1000).getTime() : null;
    const issuedAt = decoded && decoded['iat'] ? new Date(decoded['iat'] * 1000).toISOString() : null;
    const issuedAtMs = decoded && decoded['iat'] ? new Date(decoded['iat'] * 1000).getTime() : null;

    const authResponse: PostAuthResponse = { 
      token, 
      expiresAt, 
      expiresAtMs, 
      issuedAt, 
      issuedAtMs 
    }

    logger.info(loggerPrefix, `Generated token using user ID "${user.id}" and user email "${user.email}".`);

    // Reset the brute force prevention count
    // req && req.brute && req.brute.reset && req.brute.reset();

    return res.json(authResponse);
  };

  /**
   * @swagger
   *
   *  /auth/reset-password:
   *    post:
   *      deprecated: true
   *      operationId: postAuthResetPasswordMobile
   *      tags:
   *        - auth
   *      summary: Request a reset password token (mobile app only)
   *      description:
   *        Creates a reset password token to allow an unauthorized user to reset his account's password.
   *        The generated token is send to the user his e-mail address and stored in the database.
   *        The user can use that token, in combinatation with the /auth/update-password endpoint to reset his password.
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostAuthResetPasswordMobileRequestBody'
   *      responses:
   *        '400':
   *          $ref: '#/components/responses/BadRequestError'
   *        '401':
   *          $ref: '#/components/responses/UnauthorizedError'
   *        '404':
   *          $ref: '#/components/responses/NotFoundError'
   *        '200':
   *          $ref: '#/components/responses/MessageResponse'
   */
  public postAuthResetPasswordMobile = async (req: Request, res: Response) => {
    const loggerPrefix = 'Get Reset Password Token: ';
  
    const { email } = req.body as PostAuthResetPasswordMobileRequestBody;
  
    const validationSchema = joi.object().keys({
      email: joi.string().email({ minDomainSegments: 2 }).required()
    });
  
    const { error } = validationSchema.validate(req.body);
  
    if (error) {
      const message = error.details.map(detail => detail.message).join(' and ');
  
      logger.error(loggerPrefix, message);
      throw new HttpError(HttpStatus.BadRequest, message, error.details);
    }
  
    const user = await this.usersService.findOneByEmail(email);
  
    if (!user) {
      const message = 'The given e-mail address does not exist. Are you sure you already have an account?';
  
      logger.error(loggerPrefix, message);

      throw new HttpError(HttpStatus.BadRequest, message);
    }
  
    // User exists, generate a random token
    const resetPasswordToken = User.generateRandomResetPasswordTokenMobileApp();
  
    await this.usersService.updateResetPasswordToken(user.id, resetPasswordToken, new Date());
  
    // Important: keep this production URL
    // As iOS universal links pick it up correctly for all other environments
    // Make sure this URL is displaying a fallback
    // const resetPasswordUrl = `https://playpost.app/login/reset-password/${resetPasswordToken}`;
  
    // const htmlBody = `
    //   <h1>Reset your password</h1>
    //   <p>You have requested to reset your password. You can use the code below to change your password within the Playpost App.</p>
    //   <p>Your reset password code:<br /><h1><strong>${resetPasswordToken}</strong></h1></p>
    //   <p><a href="${resetPasswordUrl}">Open in Playpost App</a>
    //   <br /><br /><br /><br /><br /><br />
    //   <h3>How to change my password?</h3>
    //   <p>It's very easy. Click the link above, this will open the Playpost App in the Reset Password screen.</p>
    //   <h3>How to change my password manually?</h3>
    //   <p>Below are the manual steps to change your password within the app:</p>
    //   <ol>
    //     <li>Open the Playpost App</li>
    //     <li>Go to the Login screen</li>
    //     <li>Select "Forgot password"</li>
    //     <li>Select "Already have reset password code"</li>
    //     <li>Fill in your Reset password code: ${resetPasswordToken}</li>
    //     <li>Fill in your new password</li>
    //     <li>Save your new password and you're done!</li>
    //   </ol>
    //   <p>Need more help? E-mail us at info@playpost.app. We are happy to help you!</p>
    // `;
  
    const htmlBody = `
      <h2>Reset your password</h2>
      <p>You have requested to reset your password. You can use the code below to change your password within the Playpost App.</p>
      <p>Your reset password code:<br /><h1><strong>${resetPasswordToken}</strong></h1></p>
      <p>Copy and paste this in the Playpost App.</p>
      <br /><br /><br />
      <h3>How to change my password?</h3>
      <ol>
        <li>Open the Playpost App</li>
        <li>Go to the Login screen</li>
        <li>Select "Forgot password"</li>
        <li>Select "Already have reset password code"</li>
        <li>Fill in your Reset password code: ${resetPasswordToken}</li>
        <li>Fill in your new password</li>
        <li>Save your new password and you're done!</li>
      </ol>
    `;
  
  
    // Send e-mail using AWS SES
    await AWSSes.sendTransactionalEmail(user.email, 'Reset your password', htmlBody);
  
    return res.json({ message: 'An e-mail is send to your e-mail inbox on how to reset your password.' });
  };

  /**
   * @swagger
   *
   *  /auth/update-password:
   *    post:
   *      deprecated: true
   *      operationId: postAuthUpdatePasswordMobile
   *      tags:
   *        - auth
   *      summary: Update a password using a reset password token (mobile app only)
   *      description:
   *        Updates the user's password using a reset token.
   *        This token can be requested if the user has lost his password.
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostAuthUpdatePasswordMobileRequestBody'
   *      responses:
   *        '400':
   *          $ref: '#/components/responses/BadRequestError'
   *        '401':
   *          $ref: '#/components/responses/UnauthorizedError'
   *        '404':
   *          $ref: '#/components/responses/NotFoundError'
   *        '200':
   *          $ref: '#/components/responses/MessageResponse'
   */
  public postAuthUpdatePasswordMobile = async (req: Request, res: Response) => {
    const loggerPrefix = 'Update Password Using Token: ';

    const { resetPasswordToken, password } = req.body as PostAuthUpdatePasswordMobileRequestBody;

    const validationSchema = joi.object().keys({
      password: joi.string().min(6).required(),
      resetPasswordToken: joi.string().length(6).required()
    });

    const { error } = validationSchema.validate(req.body);

    if (error) {
      const message = error.details.map(detail => detail.message).join(' and ');

      logger.error(loggerPrefix, message);

      throw new HttpError(HttpStatus.BadRequest, message, error.details);
    }

    const user = await this.usersService.findOneByResetPasswordToken(resetPasswordToken);

    if (!user) {
      const message = `Password reset code "${resetPasswordToken}" could not be found. If you think this is incorrect, try resetting your password again.`;

      logger.error(loggerPrefix, message);

      throw new HttpError(HttpStatus.BadRequest, message);
    }

    // Update the password and set the correct date at resetPasswordAt
    await this.usersService.updatePassword(user.id, password, undefined, new Date());

    return res.json({ message: 'Your password is updated. You can now login again.' });
  };

  /**
   * @swagger
   *
   *  /auth/activate:
   *    patch:
   *      operationId: patchAuthActivate
   *      tags:
   *        - auth
   *      summary: Activate a user account using an activation token
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PatchAuthActivateRequestBody'
   *      responses:
   *        '400':
   *          $ref: '#/components/responses/BadRequestError'
   *        '401':
   *          $ref: '#/components/responses/UnauthorizedError'
   *        '404':
   *          $ref: '#/components/responses/NotFoundError'
   *        '200':
   *          $ref: '#/components/responses/MessageResponse'
   */
  public patchAuthActivate = async (req: Request, res: Response) => {
    const { activationToken } = req.body as PatchAuthActivateRequestBody;

    const userToActivate = await this.usersService.findOneByActivationToken(activationToken);

    if (!userToActivate) {
      throw new HttpError(HttpStatus.NotFound, 'No account found to activate. You probably already activated your account.');
    }

    await this.usersService.updateUserAsActivated(userToActivate.id)

    return res.json({
      message: 'Your account is activated! You can now login.'
    });
  }

  /**
   * @swagger
   *
   *  /auth/reset/password:
   *    post:
   *      operationId: postAuthResetPassword
   *      tags:
   *        - auth
   *      summary: Request a reset password token to allow resetting a password.
   *      description: 
   *        Request a resetPasswordToken to allow resetting a password.
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostAuthResetPasswordRequestBody'
   *      responses:
   *        '400':
   *          $ref: '#/components/responses/BadRequestError'
   *        '401':
   *          $ref: '#/components/responses/UnauthorizedError'
   *        '404':
   *          $ref: '#/components/responses/NotFoundError'
   *        '200':
   *          $ref: '#/components/responses/MessageResponse'
   */
  public postAuthResetPassword = async (req: Request, res: Response) => {
    const { email } = req.body as PostAuthResetPasswordRequestBody;

    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new HttpError(HttpStatus.NotFound, 'A user with this email address does not exist.', { field: 'email' });
    }

    // User exists, generate a random token
    const resetPasswordToken = User.generateRandomResetPasswordToken();

    await this.usersService.updateResetPasswordToken(user.id, resetPasswordToken, new Date());

    const htmlBody = `
      <h2>Forgot your password?</h2>
      <p>We got a request to change the password for your Playpost account.</p>
      <a href="${process.env.PUBLISHERS_BASE_URL}/auth/forgot/${resetPasswordToken}">Reset your password</a>
      <p>If you didn't request this change, you can ignore this email, but you may want to review your account security.</p>
    `;

    // Send e-mail using AWS SES
    await AWSSes.sendTransactionalEmail(user.email, 'Forgot your password? Let\s get you a new one.', htmlBody);

    return res.json({ message: `An e-mail is send to ${user.email} on how to reset your password.` });
  }

  /**
   * @swagger
   *
   *  /auth/reset/password:
   *    patch:
   *      operationId: patchAuthResetPassword
   *      tags:
   *        - auth
   *      summary: Change a password using a reset password token
   *      description: 
   *        Change a password of a user using a resetPasswordToken
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PatchAuthResetPasswordRequestBody'
   *      responses:
   *        '400':
   *          $ref: '#/components/responses/BadRequestError'
   *        '401':
   *          $ref: '#/components/responses/UnauthorizedError'
   *        '404':
   *          $ref: '#/components/responses/NotFoundError'
   *        '200':
   *          $ref: '#/components/responses/MessageResponse'
   */
  public patchAuthResetPassword = async (req: Request, res: Response) => {
    const { password, resetPasswordToken } = req.body;

    const user = await this.usersService.findOneByResetPasswordToken(resetPasswordToken);

    if (!user) {
      throw new HttpError(HttpStatus.NotFound, 'The user to reset the password for could not be found.');
    }

    // Set the new password and remove the reset password token
    await this.usersService.updatePassword(user.id, password, undefined, new Date());

    return res.json({ message: `Great succes! You have changed your password.` });
  }

}













