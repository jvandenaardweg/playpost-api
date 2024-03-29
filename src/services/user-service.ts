import { getConnection, getRepository, Repository } from 'typeorm';

import * as cacheKeys from '../cache/keys';
import { User } from '../database/entities/user';
import { HttpError, HttpStatus } from '../http-error';
import { addEmailToMailchimpList } from '../mailers/mailchimp';
import { logger } from '../utils';
import { BaseService } from './index';

export class UserService extends BaseService {
  private readonly userRepository: Repository<User>;

  constructor() {
    super();
    this.userRepository = getRepository(User);
  }

  findOneById = async (userId: string): Promise<User | undefined> => {
    return this.userRepository.findOne(userId);
  }

  findOneByEmail = async (email: string): Promise<User | undefined> => {
    const normalizedEmail = User.normalizeEmail(email)

    return this.userRepository.findOne({
      where: {
        email: normalizedEmail
      }
    });
  }

  /**
   * Finds a user by user ID and returns the password hash. Useful before updating a user his password.
   */
  findOneByIdWithPassword = async (userId: string): Promise<User | undefined> => {
    return this.userRepository.findOne(userId, { select: ['id', 'email', 'password']});
  }

  findOneByEmailWithPassword = async (email: string): Promise<User | undefined> => {
    const normalizedEmail = User.normalizeEmail(email)

    return this.userRepository.findOne({
      select: ['id', 'email', 'password'],
      where: {
        email: normalizedEmail
      }
    });
  }

  findOneByResetPasswordToken = async (resetPasswordToken: string): Promise<User | undefined> => {
    return this.userRepository.findOne({
      where: {
        resetPasswordToken
      }
    });
  }

  findOneByActivationToken = async (activationToken: string): Promise<User | undefined> => {
    return this.userRepository.findOne({
      where: {
        activationToken
      }
    });
  }

  createOne = async (email: string, password: string): Promise<void> => {
    const loggerPrefix = 'Create new user:';
    const emailAddressNormalized = User.normalizeEmail(email);
    const existingUser = await this.userRepository.findOne({ email: emailAddressNormalized });

    if (existingUser) {
      throw new HttpError(HttpStatus.Conflict, "Another user with this email address already exists. If it's yours, you can try to login.", { field: 'email' })
    }

    const hashedPassword = await User.hashPassword(password);

    const newUser = new User();

    newUser.email = emailAddressNormalized;
    newUser.password = hashedPassword;

    // Create the user

    // get a connection and create a new query runner
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();

    // establish real database connection using our new query runner
    await queryRunner.connect();

    // lets now open a new transaction:
    await queryRunner.startTransaction();

    try {
      // First, create a user
      logger.info(loggerPrefix, `Should create user:`, newUser);

      // Create the user
      const savedUser = await queryRunner.manager.save(newUser);

      const user = await queryRunner.manager.findOne(User, savedUser.id, {
        select: ['id', 'email', 'activationToken']
      });

      if (!user) {
        logger.info(loggerPrefix, `Could not find the user after creating it.`);
        throw new Error('Oops! Could not find the new user after creating it.');
      }

      try {
        logger.info(loggerPrefix, `Adding "${user.email}" to Mailchimp list.`);
        await addEmailToMailchimpList(user.email);
      } catch (err) {
        logger.error(loggerPrefix, `Failed to add ${user.email} to Mailchimp list.`, err);
        throw err;
      }

      // commit transaction now:
      await queryRunner.commitTransaction();

      await queryRunner.release();

      // Transaction successfull!

      return;

    } catch (err) {
      logger.error(loggerPrefix, 'Error while creating user:', JSON.stringify(err));

      // since we have errors lets rollback changes we made
      await queryRunner.rollbackTransaction();

      await queryRunner.release();

      throw new HttpError(HttpStatus.InternalServerError, 'Oops! An error happened while creating your account. Please try again.');
    }
  }

  delete = async (userId: string): Promise<void> => {
    const userToDelete = await this.userRepository.findOne(userId);

    if (!userToDelete) {
      throw new HttpError(HttpStatus.NotFound, 'User to delete could not be found.');
    }

    await this.userRepository.remove(userToDelete);

    // Remove the JWT verification cache for faster API responses
    const cache = getConnection('default').queryResultCache;

    if (cache) {
      await cache.remove([cacheKeys.jwtVerifyUser(userId)]);
    }

    return;
  }

  /**
   * Update's the user's e-mail address. Also does a check if the new e-mail address is
   * available to be used.
   */
  updateEmail = async (forUserId: string, newEmail: string) => {
    const normalizedEmail = User.normalizeEmail(newEmail)

    const existingUserWithSameEmailAddress = await this.userRepository.findOne({
      where: {
        email: normalizedEmail
      }
    });

    // Check wether the e-mail address is already been used by somebody else
    if (existingUserWithSameEmailAddress && existingUserWithSameEmailAddress.id !== forUserId) {
      throw new HttpError(HttpStatus.Conflict, 'There is already another user this e-mail address. Please choose a different e-mail address.')
    }

    const result = await this.userRepository.update(forUserId, {
      email: newEmail
    })

    return result;
  }

  updatePassword = async (forUserId: string, plainTextPassword: string, resetPasswordToken?: string, resetPasswordAt?: Date) => {
    const newHashedPassword = await User.hashPassword(plainTextPassword);

    const result = await this.userRepository.update(forUserId, {
      password: newHashedPassword,
      resetPasswordToken,
      resetPasswordAt
    })

    return result;
  }

  updateAuthenticatedAt = async (forUserId: string, authenticatedAt: Date) => {
    const result = await this.userRepository.update(forUserId, {
      authenticatedAt,
      resetPasswordToken: undefined // Because a login is successfull, we can also remove the resetPasswordToken if it exists. It's not needed anymore.
    })

    return result;
  }

  updateResetPasswordToken = async (forUserId: string, resetPasswordToken: string, requestResetPasswordAt: Date) => {
    const result = await this.userRepository.update(forUserId, {
      resetPasswordToken,
      requestResetPasswordAt
    })

    return result;
  }

  updateUserAsActivated = async (forUserId: string) => {
    const result = await this.userRepository.update(forUserId, {
      activationToken: undefined,
      activatedAt: new Date()
    })

    return result;
  }
}
