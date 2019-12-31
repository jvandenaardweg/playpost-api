import { getConnection, getRepository, Repository } from 'typeorm';

import * as cacheKeys from '../cache/keys';
import { Organization } from '../database/entities/organization';
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

  findOneById = async (userId: string) => {
    return this.userRepository.findOne(userId);
  }

  findOneByEmail = async (email: string) => {
    const normalizedEmail = User.normalizeEmail(email)

    return this.userRepository.findOne({
      where: {
        email: normalizedEmail
      }
    });
  }

  create = async (email: string, password: string, organization?: { name: string }): Promise<void> => {
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

      const savedUser = await queryRunner.manager.save(newUser);

      // If a organization name is giving during signup, create the organization and attach it to the user
      if (organization) {
        const newOrganization = new Organization();
        // const newCustomer = new Customer();

        // newCustomer.id = uuid.v4();

        newOrganization.name = organization.name;

        // Add the current user as an admin
        newOrganization.admin = savedUser;

        // Use the organization name to add it to stripe
        // try {
        //   logger.info(loggerPrefix, `Adding organization to Stripe...`);
        //   const stripeCustomer = await stripe.customers.create({
        //     name: newOrganization.name,
        //     email: savedUser.email,
        //     preferred_locales: ['en-US'], // https://support.stripe.com/questions/language-options-for-customer-emails
        //     metadata: {
        //       customerId: newCustomer.id,
        //       userId: savedUser.id
        //     }
        //   })

        //   newCustomer.stripeCustomerId = stripeCustomer.id;
        // } catch (err) {
        //   logger.error(loggerPrefix, `Failed to add organization to Stripe:`, JSON.stringify(err));
        //   throw err;
        // }

        // const savedCustomer = await queryRunner.manager.save(Customer, newCustomer);

        // newOrganization.customer = savedCustomer;

        newOrganization.users = [savedUser];

        logger.info(loggerPrefix, `Create organization:`, newOrganization);

        await queryRunner.manager.save(Organization, newOrganization);
      }

      const user = await queryRunner.manager.findOne(User, savedUser.id, {
        select: ['id', 'email', 'activationToken']
      });

      if (!user) {
        logger.info(loggerPrefix, `Could not find the user after creating it.`);
        throw new Error('Oops! Could not find the new user after creating it.');
      }

      // If the user signs up as an organization, only send the activation mail
      // As this is only for our "Playpost for Publishers" service
      // Our mobile app users also use this endpoint, without the organization
      if (organization) {
        try {
          if (!user.activationToken) {
            throw new HttpError(HttpStatus.BadRequest, 'No activation token found.');
          }

          logger.info(loggerPrefix, `Sending activation email to: ${user.email} using token: ${user.activationToken}`);
          await User.sendActivationEmail(user.activationToken, user.email);
        } catch (err) {
          logger.error(loggerPrefix, `Failed to send activation mail to: ${user.email}`, err);
          throw err;
        }
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
}
