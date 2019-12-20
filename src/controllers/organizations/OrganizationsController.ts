import joi from '@hapi/joi';
import { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';

import { Publication } from '../../database/entities/publication';
import * as AWSSes from '../../mailers/aws-ses';
import { BillingService } from '../../services/BillingService';
import { OrganizationService } from '../../services/OrganizationService';
import { PublicationService } from '../../services/PublicationService';
import { UsageRecordService } from '../../services/UsageRecordService';
import { UsersService } from '../../services/UsersService';
import { PermissionRoles } from '../../typings';
import { BaseController } from '../index';

export class OrganizationsController extends BaseController {
  private organizationService: OrganizationService;
  private usageRecordService: UsageRecordService;
  private billingService: BillingService;
  private usersService: UsersService;
  private publicationService: PublicationService;

  constructor() {
    super()
    this.organizationService = new OrganizationService();
    this.usageRecordService = new UsageRecordService();
    this.billingService = new BillingService();
    this.usersService = new UsersService()
    this.publicationService = new PublicationService()
  }

  /**
   * Handles access permissions.
   */
  public permissions = (roles: PermissionRoles) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
      const userId = req.user!.id;
      const { organizationId } = req.params;

      try {
        // Only check for params when on routes that have params
        if (Object.keys(req.params).length) {
          const validationSchema = joi.object().keys({
            organizationId: joi.string().uuid().required(),
            stripeSubscriptionId: joi.string().optional(),
            stripeSubscriptionItemId: joi.string().optional()
          })

          const { error } = validationSchema.validate(req.params);

          if (error) {
            throw {
              status: 400,
              message: error.details[0].message,
              details: error.details[0]
            }
          }
        }

        // If the role is a user (so every authenticated user), skip the resource permission check
        if (roles.includes('user')) {
          return next();
        }

        // If we end up here, we want to check if the authenticated user has permission to view this organization

        // Get the organization so we can determine if the user is an admin or normal user of this resource
        const organization = await this.organizationService.findOneById(organizationId);

        // Only allow access to this resource if it's a user or admin
        const isAdminInOrganization = organization.admin.id === userId;
        const isUserInOrganization = organization.users.some(user => user.id === userId);

        if (roles.includes('organization-user') && !isUserInOrganization && !isAdminInOrganization) {
          return res.status(403).json({
            message: 'You have no access to this organization.'
          });
        }

        if (roles.includes('organization-admin') && !isAdminInOrganization) {
          return res.status(403).json({
            message: 'You have no admin access to this organization.'
          });
        }

        return next();
      } catch (err) {
        return this.handleError(err, res);
      }
    }
  }

  /**
   * Finds all organizations belonging to the authenticated user.
   *
   * @returns Promise<Response>
   */
  public getAll = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.id;

    try {
      const requestQuery = this.validatePagingParams(req.query);
      const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
      const response = await this.organizationService.findAll(userId, page, perPage, skip, take);

      return res.json(response);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Get one organization belonging to the authenticated user.
   *
   * @returns Promise<Response>
   */
  public getOne = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const organization = await this.organizationService.findOneById(organizationId);

      return res.json(organization);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  public getPublications = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const requestQuery = this.validatePagingParams(req.query);
      const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
      const publications = await this.organizationService.findAllPublications(organizationId, page, perPage, skip, take);

      return res.json(publications);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Get all users within the organization.
   */
  public getUsers = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const requestQuery = this.validatePagingParams(req.query);
      const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
      const users = await this.organizationService.findAllUsers(organizationId, page, perPage, skip, take);

      return res.json(users);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Get the customer information of the organization. This includes data from Stripe.
   */
  public getCustomer = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const customer = await this.organizationService.findOneCustomer(organizationId);

      const { stripeCustomerId } = customer;

      if (!stripeCustomerId) {
        return res.status(204).send();
      }

      const stripeCustomer = await this.billingService.findOneCustomer(stripeCustomerId);
      const isSubscribed = stripeCustomer.subscriptions.data[0].current_period_end * 1000 > new Date().getTime();
      const lastSubscriptionStatus = (isSubscribed) ? stripeCustomer.subscriptions.data[0].status : null;

      return res.json({
        ...customer,
        isSubscribed,
        lastSubscriptionStatus,
        stripeCustomer
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Get the admin user of the organization.
   */
  public getAdmin = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const admin = await this.organizationService.findOneAdmin(organizationId);

      return res.json(admin);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Changes the admin of this organization. The user must already exist.
   * Only admins of an organization can do this.
   */
  public putAdmin = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;
    const { newAdminUserId } = req.body;
    const userId = req.user!.id;

    try {
      const updatedOrganization = await this.organizationService.saveAdmin(organizationId, userId, newAdminUserId);

      return res.json(updatedOrganization);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Creates a publication for the selected organization.
   */
  public createPublication = async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { name, url } = req.body;
    const userId = req.user!.id;

    try {
      // When we end up here, the user is allowed to create a publiction for this organization

      const organization = await this.organizationService.findOneById(organizationId);

      if (!organization) {
        throw {
          status: 404,
          message: 'Organization could not be found.'
        }
      }

      const user = await this.usersService.findOne(userId);

      if (!user) {
        throw {
          status: 400,
          message: `We could not find your account.`
        }
      }

      const newPublication = new Publication();

      newPublication.name = name;
      newPublication.url = url;
      newPublication.users = [user]; // Connect the admin to this publication so he has access to it
      newPublication.organization = organization; // Connect the organization of the user to the publication

      // Create the publication and attach it to the organization and user (admin)
      const createdPublication = await this.publicationService.save(newPublication);

      return res.json(createdPublication);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Associates a existing user to an organization
   */
  public createUser = async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { email } = req.body;

    try {
      const newUser = await this.usersService.findOneByEmail(email);

      if (!newUser) {
        throw {
          status: 404,
          message: 'A user with that email address does not exist.'
        }
      }

      const organization = await this.organizationService.findOneById(organizationId);

      if (!organization) {
        throw {
          status: 404,
          message: 'The organization does not exist.'
        }
      }

      const userExistsInOrganization = organization.users.some(organizationUser => organizationUser.id === newUser.id);

      if (userExistsInOrganization) {
        throw {
          status: 409,
          message: 'The user already exists in this organization.'
        }
      }

      // Attach existing users and new user to the organization
      organization.users.push(newUser);

      const updatedOrganization = await this.organizationService.save(organization);

      await AWSSes.sendTransactionalEmail(
        newUser.email,
        `You have been added to organization: ${updatedOrganization.name}`,
        `
          <p>Hi,</p>
          <p>This is an e-mail to confirm you have been added to organization <strong>${updatedOrganization.name}</strong>.</p>
          <p><a href="${process.env.PUBLISHERS_BASE_URL}">Login</a></p>
        `
      )

      return res.json(updatedOrganization);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  public deleteUser = async (req: Request, res: Response) => {
    const { organizationId, userId } = req.params;

    try {
      const organization = await this.organizationService.findOneById(organizationId);

      if (!organization) {
        return res.status(404).json({
          message: 'The organization does not exist.'
        });
      }

      const userExistsInOrganization = organization.users.some(organizationUser => organizationUser.id === userId);

      if (!userExistsInOrganization) {
        return res.status(409).json({
          message: 'The user does not exist in this organization.'
        });
      }

      // Filter out the user we want to delete
      const usersWithoutUserToDelete = organization.users.filter(organizationUser => organizationUser.id !== userId);
      const userToDelete = organization.users.find(organizationUser => organizationUser.id === userId);

      // Set the new users, without the deleted user
      organization.users = usersWithoutUserToDelete;

      const updatedOrganization = await this.organizationService.save(organization);

      if (userToDelete) {
        await AWSSes.sendTransactionalEmail(
          userToDelete.email,
          `You have been removed from organization: ${updatedOrganization.name}`,
          `
            <p>Hi,</p>
            <p>This is an e-mail to confirm you have been removed from organization <strong>${updatedOrganization.name}</strong>.</p>
            <p>If this is correct, you can safely ignore and remove this email.</p.
            <p>If you think this is incorrect, please reach out to us.</p>
          `
        )
      }

      return res.json(updatedOrganization);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Deletes a publication from the database.
   * IMPORTANT: Very destructive operation.
   */
  public deletePublication = async (req: Request, res: Response) => {
    const { organizationId, publicationId } = req.params;

    try {
      const organization = await this.organizationService.findOneById(organizationId);

      if (!organization) {
        throw {
          status: 404,
          message: 'The organization does not exist.'
        }
      }

      const publication = await this.publicationService.findOneById(publicationId);

      if (!publication) {
        throw {
          status: 404,
          message: 'Publication does not exist.'
        }
      }

      // TODO: delete publication articles
      // TODO: delete publication audiofiles

      await this.publicationService.remove(publication);

      return res.status(200).send();
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  public patchCustomer = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;
    const requestBody = req.body as Stripe.customers.ICustomerUpdateOptions;

    const validationSchema = joi.object().keys({
      email: joi.string().email({ minDomainSegments: 2 }).required(),
      name: joi.string().max(50).required(),
      address: joi.object().keys({
        line1: joi.string().max(50).required(),
        line2: joi.string().allow(null).max(50).optional(),
        city: joi.string().required().max(50),
        postal_code: joi.string().max(10).required(),
        state: joi.string().allow(null).max(50).optional(),
        country: joi.string().max(50).required()
      }).required(),
      phone: joi.string().allow(null).max(100).optional()
    });

    try {
      const { error } = validationSchema.validate(req.body);

      if (error) {
        throw {
          status: 400,
          message: error.details[0].message,
          details: error.details[0]
        }
      }

      const updatedCustomer = await this.organizationService.updateCustomer(organizationId, requestBody);

      return res.json(updatedCustomer);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  public getCustomerSubscriptions = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const customerSubscriptions = await this.organizationService.findCustomerSubscriptions(organizationId);

      return res.json(customerSubscriptions.data);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  public getCustomerInvoices = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const customerInvoices = await this.organizationService.findCustomerInvoices(organizationId);

      return res.json(customerInvoices.data);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  public getCustomerInvoicesUpcoming = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const customerInvoicesUpcoming = await this.organizationService.findCustomerInvoicesUpcoming(organizationId);

      return res.json(customerInvoicesUpcoming);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  public getCustomerSubscription = async (req: Request, res: Response): Promise<Response> => {
    const { stripeSubscriptionId } = req.params;

    try {
      const customerSubscription = await this.organizationService.findCustomerSubscription(stripeSubscriptionId);

      return res.json(customerSubscription);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  public getCustomerSubscriptionItems = async (req: Request, res: Response): Promise<Response> => {
    const { stripeSubscriptionId } = req.params;

    try {
      const customerSubscriptionItems = await this.organizationService.findCustomerSubscriptionItems(stripeSubscriptionId);

      return res.json(customerSubscriptionItems);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  public getCustomerUsageRecordsSummaries = async (req: Request, res: Response): Promise<Response> => {
    const { stripeSubscriptionItemId } = req.params;

    try {
      const customerUsageRecordsSummaries = await this.organizationService.findCustomerSubscriptionItemsUsageRecordsSummaries(stripeSubscriptionItemId);

      return res.json(customerUsageRecordsSummaries);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  public getCustomerUsageRecords = async (req: Request, res: Response): Promise<Response> => {
    const { stripeSubscriptionItemId } = req.params;

    try {
      const customerUsageRecords = await this.usageRecordService.findAllForSubscriptionItemId(stripeSubscriptionItemId, 1, 99999, 0, 99999)

      return res.json(customerUsageRecords);
    } catch (err) {
      return this.handleError(err, res);
    }
  };
}
