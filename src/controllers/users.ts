import joi from '@hapi/joi';
import { Request, Response } from 'express';
import { getConnection, getRepository } from 'typeorm';
import * as cacheKeys from '../cache/keys';
import { Organization } from '../database/entities/organization';
import { User } from '../database/entities/user';
import { addEmailToMailchimpList } from '../mailers/mailchimp';
import { logger } from '../utils';
import { validateInput } from '../validators/entity';
import { routeIsProtected } from './auth';
// import { stripe } from '../billing';
// import { Customer } from '../database/entities/customer';
// import uuid from 'uuid';

const MESSAGE_USER_EMAIL_EXISTS = 'Another user with this email address already exists. If it\'s yours, you can try to login.'
const MESSAGE_USER_NOT_FOUND = 'No user found';
const MESSAGE_USER_DELETED = 'User is deleted! This cannot be undone.';
const MESSAGE_USER_NOT_ALLOWED = 'You are not allowed to do this.';

interface CreateUserRequestBody {
  email: string;
  password: string;
  organization?: {
    name: string
  };
}

export const createUser = [
  async (req: Request, res: Response) => {
    const loggerPrefix = 'Create new user:';

    const { email, password, organization } = req.body as CreateUserRequestBody;
    const userRepository = getRepository(User);

    const validationSchema = joi.object().keys({
      email: joi.string().email({ minDomainSegments: 2 }),
      password: joi.string().min(6),
      organization: joi.object().optional()
    });

    const userValidationResult = validationSchema.validate(req.body);

    if (userValidationResult.error) {
      const firstError = userValidationResult.error.details[0];

      return res.status(400).json({
        message: firstError.message,
        details: userValidationResult.error.details
      });
    }

    const emailAddressNormalized = User.normalizeEmail(email);
    const existingUser = await userRepository.findOne({ email: emailAddressNormalized });

    if (existingUser) { return res.status(409).json({ message: MESSAGE_USER_EMAIL_EXISTS, field: 'email' }); }

    const hashedPassword = await User.hashPassword(password);

    const newUser = new User();

    newUser.email = emailAddressNormalized;
    newUser.password = hashedPassword;

    // Validate the input
    const validationResult = await validateInput(User, newUser);
    if (validationResult.errors.length) { return res.status(400).json(validationResult); }

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
        const organizationValidationSchema = joi.object().keys({
          organization: joi.object().keys({
            name: joi.string().max(50).required().messages({
              'string.base': 'Organization name must be a string.',
              'string.empty': 'Organization name cannot be empty.',
              'string.max': 'Organization name should have a maximum length of {#limit}.',
              'any.required': 'An organization name is required.'
            })
          })
        });
        // Only validate the organization object, remove email and password
        const organizationBody = { organization: req.body.organization }
        const organizationValidation = organizationValidationSchema.validate(organizationBody);

        if (organizationValidation.error) {
          const firstErrorMessage = organizationValidation.error.details[0].message;
          return res.status(400).json({
            message: firstErrorMessage,
            details: organizationValidation.error.details
          });
        }

        const newOrganization = new Organization();
        // const newCustomer = new Customer();

        // newCustomer.id = uuid.v4();

        newOrganization.name = organization.name;

        // Add the current user as an admin
        newOrganization.admin = savedUser;

        // Validate the input with our entity
        const validationResultOrganization = await validateInput(Organization, newOrganization);

        if (validationResult.errors.length) {
          return res.status(400).json({
            message: validationResultOrganization,
            field: 'organizationName'
          });
        }

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

      return res.status(200).send();

    } catch (err) {
      logger.error(loggerPrefix, 'Error while creating user:', JSON.stringify(err));

      // since we have errors lets rollback changes we made
      await queryRunner.rollbackTransaction();

      await queryRunner.release();

      return res.status(500).json({
        message: 'Oops! An error happened while creating your account. Please try again.'
      });
    }
  }
];

export const deleteUser = [
  routeIsProtected,
  async (req: Request, res: Response) => {
    const userEmail = req.user.email;
    const { userId } = req.params;
    const userRepository = getRepository(User);

    if (userEmail !== 'jordyvandenaardweg@gmail.com') { return res.status(403).json({ message: MESSAGE_USER_NOT_ALLOWED }); }

    const validationResult = await validateInput(User, { id: userId });
    if (validationResult.errors.length) { return res.status(400).json(validationResult); }

    const userToDelete = await userRepository.findOne(userId);

    if (!userToDelete) { return res.status(400).json({ message: MESSAGE_USER_NOT_FOUND }); }

    await userRepository.remove(userToDelete);

    // Remove the JWT verification cache for faster API responses
    const cache = await getConnection('default').queryResultCache;
    if (cache) { await cache.remove([cacheKeys.jwtVerifyUser(userId)]); }

    return res.json({ message: MESSAGE_USER_DELETED });
  }
];

export const findAllUsers = [
  routeIsProtected,
  async (req: Request, res: Response) => {
    const userEmail = req.user.email;
    const userRepository = getRepository(User);

    if (userEmail !== 'jordyvandenaardweg@gmail.com') { return res.status(403).json({ message: 'You dont have access to this endpoint.' }); }

    const users = await userRepository.find({
      order: {
        createdAt: 'DESC'
      }
    });

    return res.json(users);
  }
];

