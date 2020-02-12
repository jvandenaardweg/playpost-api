import joi from '@hapi/joi';
import { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';

import { Publication } from '../../database/entities/publication';
import { HttpError, HttpStatus } from '../../http-error';
import * as AWSSes from '../../mailers/aws-ses';
import { BillingService } from '../../services/billing-service';
import { OrganizationService } from '../../services/organization-service';
import { PublicationService } from '../../services/publication-service';
import { UsageRecordService } from '../../services/usage-record-service';
import { UserService } from '../../services/user-service';
import { PermissionRoles } from '../../typings';
import { BaseController } from '../index';

export class OrganizationsController extends BaseController {
  private organizationService: OrganizationService;
  private usageRecordService: UsageRecordService;
  private billingService: BillingService;
  private usersService: UserService;
  private publicationService: PublicationService;

  constructor() {
    super()
    this.organizationService = new OrganizationService();
    this.usageRecordService = new UsageRecordService();
    this.billingService = new BillingService();
    this.usersService = new UserService()
    this.publicationService = new PublicationService()
  }

  /**
   * Handles access permissions.
   */
  public permissions = (roles: PermissionRoles) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
      const userId = req.user!.id;
      const { organizationId } = req.params;

      // Only check for params when on routes that have params
      if (Object.keys(req.params).length) {
        const validationSchema = joi.object().keys({
          organizationId: joi.string().uuid().required(),
          stripeSubscriptionId: joi.string().optional(),
          stripeSubscriptionItemId: joi.string().optional(),
          stripePaymentMethodId: joi.string().optional()
        })

        const { error } = validationSchema.validate(req.params);

        if (error) {
          throw new HttpError(HttpStatus.BadRequest, error.details[0].message, error.details[0])
        }
      }

      // If the role is a user (so every authenticated user), skip the resource permission check
      if (roles.includes('user')) {
        return next();
      }

      // If we end up here, we want to check if the authenticated user has permission to view this organization

      // Get the organization so we can determine if the user is an admin or normal user of this resource
      const organization = await this.organizationService.findOneById(organizationId);

      if (!organization) {
        throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
      }

      // Only allow access to this resource if it's a user or admin
      const isAdminInOrganization = organization.admin && organization.admin.id === userId;
      const isUserInOrganization = organization.users && organization.users.some(user => user.id === userId);

      if (roles.includes('organization-user') && !isUserInOrganization && !isAdminInOrganization) {
        throw new HttpError(HttpStatus.Forbidden, 'You have no access to this organization.');
      }

      if (roles.includes('organization-admin') && !isAdminInOrganization) {
        throw new HttpError(HttpStatus.Forbidden, 'You have no admin access to this organization.');
      }

      return next();
    }
  }

  /**
   * Finds all organizations belonging to the authenticated user.
   *
   * @returns Promise<Response>
   */
  public getAll = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.id;

    const requestQuery = this.validatePagingParams(req.query);
    const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    const response = await this.organizationService.findAll(userId, page, perPage, skip, take);

    return res.json(response);
  };

  /**
   * Get one organization belonging to the authenticated user.
   *
   * @returns Promise<Response>
   */
  public getOne = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    const organization = await this.organizationService.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    return res.json(organization);
  };

  public getPublications = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    const requestQuery = this.validatePagingParams(req.query);
    const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    const publications = await this.organizationService.findAllPublications(organizationId, page, perPage, skip, take);

    return res.json(publications);
  };

  /**
   * Get all users within the organization.
   */
  public getAllUsers = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    const requestQuery = this.validatePagingParams(req.query);
    const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    const users = await this.organizationService.findAllUsers(organizationId, page, perPage, skip, take);

    return res.json(users);
  };

  /**
   * Get the customer information of the organization. This includes data from Stripe.
   */
  public getOneCustomer = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    const customer = await this.organizationService.findOneCustomer(organizationId);

    if (!customer) {
      throw new HttpError(HttpStatus.NotFound, 'Customer for this organization does not exist.');
    }

    const { stripeCustomerId } = customer;

    if (!stripeCustomerId) {
      return res.status(204).send();
    }

    const stripeCustomer = await this.billingService.findOneCustomer(stripeCustomerId)

    // const subscriptions = await this.billingService.findOneCustomerSubscriptions(stripeCustomerId)
    // const isSubscribed = subscriptions[0].current_period_end * 1000 > new Date().getTime();
    // const lastSubscriptionStatus = (isSubscribed) ? subscriptions[0].status : null;

    return res.json(stripeCustomer);
  };

  /**
   * Get the admin user of the organization.
   */
  public getOneAdmin = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    const admin = await this.organizationService.findOneAdmin(organizationId);

    if (!admin) {
      throw new HttpError(HttpStatus.NotFound, 'Admin for this organization does not exist.');
    }

    return res.json(admin);
  };

  /**
   * Changes the admin of this organization. The user must already exist.
   * Only admins of an organization can do this.
   */
  public putOneAdmin = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;
    const { newAdminUserId } = req.body;
    const userId = req.user!.id;

    if (userId === newAdminUserId) {
      throw new HttpError(HttpStatus.BadRequest, 'This user is already an admin of this organization.');
    }

    const organization = await this.organizationService.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    const updatedOrganization = await this.organizationService.saveAdmin(organization, newAdminUserId);

    return res.json(updatedOrganization);
  };

  /**
   * Creates a publication for the selected organization.
   */
  public createOnePublication = async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { name, url } = req.body;
    const userId = req.user!.id;

    // When we end up here, the user is allowed to create a publiction for this organization

    const organization = await this.organizationService.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new HttpError(HttpStatus.NotFound, 'We could not find your account.');
    }

    const newPublication = new Publication();

    newPublication.name = name;
    newPublication.url = url;
    newPublication.users = [user]; // Connect the admin to this publication so he has access to it
    newPublication.organization = organization; // Connect the organization of the user to the publication

    // Create the publication and attach it to the organization and user (admin)
    const createdPublication = await this.publicationService.save(newPublication);

    return res.json(createdPublication);
  };

  /**
   * Associates a existing user to an organization
   */
  public createOneUser = async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { email } = req.body;

    const newUser = await this.usersService.findOneByEmail(email);

    if (!newUser) {
      throw new HttpError(HttpStatus.NotFound, 'A user with that email address does not exist.');
    }

    const organization = await this.organizationService.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    if (!organization.users) {
      throw new HttpError(HttpStatus.NotFound, 'Users does not exist on organization.');
    }

    const userExistsInOrganization = organization.users.some(organizationUser => organizationUser.id === newUser.id);

    if (userExistsInOrganization) {
      throw new HttpError(HttpStatus.Conflict, 'The user already exists in this organization.');
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
  };

  public deleteOneUser = async (req: Request, res: Response) => {
    const { organizationId, userId } = req.params;

    const organization = await this.organizationService.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'The organization does not exist.');
    }

    if (!organization.users) {
      throw new HttpError(HttpStatus.NotFound, 'Users does not exist on organization.');
    }

    const userExistsInOrganization = organization.users.some(organizationUser => organizationUser.id === userId);

    if (!userExistsInOrganization) {
      throw new HttpError(HttpStatus.NotFound, 'The user does not exist in this organization.');
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
  };

  /**
   * Deletes a publication from the database.
   * IMPORTANT: Very destructive operation.
   */
  public deleteOnePublication = async (req: Request, res: Response) => {
    const { organizationId, publicationId } = req.params;

    const organization = await this.organizationService.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'The organization does not exist.');
    }

    const publication = await this.publicationService.findOneById(publicationId);

    if (!publication) {
      throw new HttpError(HttpStatus.NotFound, 'The publication does not exist.');
    }

    // TODO: delete publication articles
    // TODO: delete publication audiofiles

    await this.publicationService.remove(publication);

    return res.status(200).send();
  };

  public patchOneCustomer = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;
    const requestBody = req.body as Stripe.CustomerUpdateParams;

    const validationSchema = joi.object().keys({
      email: joi.string().email({ minDomainSegments: 2 }).required(),
      name: joi.string().max(50).required(),
      address: joi.object().keys({
        line1: joi.string().max(50).required(),
        line2: joi.string().allow('').max(50).optional(),
        city: joi.string().required().max(50),
        postal_code: joi.string().max(10).required(),
        state: joi.string().allow('').max(50).optional(),
        country: joi.string().max(50).required()
      }).required()
    });

    const { error } = validationSchema.validate(req.body);

    if (error) {
      throw new HttpError(HttpStatus.BadRequest, error.details[0].message, error.details[0])
    }

    const updatedCustomer = await this.organizationService.updateOneCustomer(organizationId, requestBody);

    return res.json(updatedCustomer);
  };

  public getAllCustomerSubscriptions = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    const customerSubscriptions = await this.organizationService.findAllCustomerSubscriptions(organizationId);

    if (!customerSubscriptions) {
      return res.status(HttpStatus.NoContent).json(customerSubscriptions);
    }

    return res.json(customerSubscriptions);
  };

  public getAllCustomerInvoices = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    const customerInvoices = await this.organizationService.findAllCustomerInvoices(organizationId);

    return res.json(customerInvoices.data);
  };

  public getAllCustomerInvoicesUpcoming = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    const customerInvoicesUpcoming = await this.organizationService.findAllCustomerInvoicesUpcoming(organizationId);

    return res.json(customerInvoicesUpcoming);
  };

  public getOneCustomerSubscription = async (req: Request, res: Response): Promise<Response> => {
    const { stripeSubscriptionId } = req.params;

    const customerSubscription = await this.organizationService.findOneCustomerSubscription(stripeSubscriptionId);

    return res.json(customerSubscription);
  };

  public getAllCustomerSubscriptionItems = async (req: Request, res: Response): Promise<Response> => {
    const { stripeSubscriptionId } = req.params;

    const customerSubscriptionItems = await this.organizationService.findAllCustomerSubscriptionItems(stripeSubscriptionId);

    return res.json(customerSubscriptionItems);
  };

  public getAllCustomerPaymentMethods = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    const organizationCustomer = await this.organizationService.findOneCustomer(organizationId);

    if (!organizationCustomer) {
      throw new HttpError(HttpStatus.NotFound, 'Customer on organization not found.')
    }

    if (!organizationCustomer.stripeCustomerId) {
      throw new HttpError(HttpStatus.NotFound, 'Organization is not a customer.')
    }

    const customerPaymentMethods = await this.billingService.findAllCustomerPaymentMethods(organizationCustomer.stripeCustomerId);

    return res.json(customerPaymentMethods);
  };

  public patchOneCustomerPaymentMethod = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId, stripePaymentMethodId } = req.params;
    const { billingDetailsName, cardExpireMonth, cardExpireYear } = req.body;

    const validationSchema = joi.object().keys({
      billingDetailsName: joi
        .string()
        .required(),
      cardExpireMonth: joi
        .number()
        .integer()
        .min(1) // januari
        .max(12) // december
        .required(),
      cardExpireYear: joi
        .number()
        .integer()
        .min(new Date().getFullYear()) // Card expire year can be no less than the current year
        .max(new Date().getFullYear() + 10) // Card expire year can be a maximum of 10 years in the future
        .required()
    });

    const { error } = validationSchema.validate(req.body);

    if (error) {
      throw new HttpError(HttpStatus.BadRequest, error.details[0].message, error.details[0])
    }

    const organizationCustomer = await this.organizationService.findOneCustomer(organizationId);

    if (!organizationCustomer) {
      throw new HttpError(HttpStatus.NotFound, 'Customer on organization not found.')
    }

    if (!organizationCustomer.stripeCustomerId) {
      throw new HttpError(HttpStatus.NotFound, 'Organization is not a customer.')
    }

    // Find the current payment method to verify it's existence
    const currentPaymentMethod = await this.billingService.findOnePaymentMethod(stripePaymentMethodId);

    if (!currentPaymentMethod) {
      throw new HttpError(HttpStatus.NotFound, 'Current payment method not found.');
    }

    // Check if the payment method belongs to the customer
    if (currentPaymentMethod.customer !== organizationCustomer.stripeCustomerId) {
      throw new HttpError(HttpStatus.BadRequest, 'This payment method does not belong to the customer.');
    }

    // All good, we can update the payment method information

    const updatedPaymentMethod = await this.billingService.updateOneCustomerPaymentMethod(stripePaymentMethodId, billingDetailsName, cardExpireMonth, cardExpireYear);

    return res.json(updatedPaymentMethod);
  };

  public getAllCustomerUsageRecordsSummaries = async (req: Request, res: Response): Promise<Response> => {
    const { stripeSubscriptionItemId } = req.params;

    const customerUsageRecordsSummaries = await this.organizationService.findAllCustomerSubscriptionItemsUsageRecordsSummaries(stripeSubscriptionItemId);

    return res.json(customerUsageRecordsSummaries);
  };

  public getAllCustomerUsageRecords = async (req: Request, res: Response): Promise<Response> => {
    const { stripeSubscriptionItemId } = req.params;

    const customerUsageRecords = await this.usageRecordService.findAllBySubscriptionItemId(stripeSubscriptionItemId, 1, 99999, 0, 99999)

    return res.json(customerUsageRecords);
  };

  /**
   * Delete (cancel) a subscription using the Stripe subscription ID.
   */
  public deleteOneSubscription = async (req: Request, res: Response): Promise<Response> => {
    const { stripeSubscriptionId } = req.params;

    const cancelSubscriptionResult = await this.organizationService.cancelSubscription(stripeSubscriptionId);

    return res.json(cancelSubscriptionResult);
  }

  /**
   * Buys a new subscription plan on behalve of the organization.
   */
  public buyNewSubscriptionPlan = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;
    const { stripePlanId, stripePaymentMethodId } = req.body; // The "stripePaymentMethodId" is created on the frontend using Stripe Elements

    if (!stripePlanId) {
      throw new HttpError(HttpStatus.BadRequest, 'stripePlanId is required.');
    }

    if (!stripePaymentMethodId) {
      throw new HttpError(HttpStatus.BadRequest, 'stripePaymentMethodId is required.');
    }

    // Verify if the organization already has a customer object
    const customer = await this.organizationService.findOneCustomer(organizationId);

    if (!customer) {
      throw new HttpError(HttpStatus.NotFound, 'Customer for this organization is not found.');
    }

    // Verify if the organization has a Stripe Customer ID
    if (!customer.stripeCustomerId) {
      throw new HttpError(HttpStatus.NotFound, 'Customer for this organization has no billing customer ID.');
    }

    // Verify if the customer exists in Stripe
    const stripeCustomer = await this.billingService.findOneCustomer(customer.stripeCustomerId);

    if (!stripeCustomer) {
      throw new HttpError(HttpStatus.NotFound, 'Customer does not exist on billing service.');
    }

    // Verify if the subscription plan exists
    const stripePlan = await this.billingService.findOnePlan(stripePlanId);

    if (!stripePlan) {
      throw new HttpError(HttpStatus.NotFound, 'Subscription plan does not exist on billing service.');
    }

    // Attach the payment method to the customer as a default
    // This payment method will be used for future charges
    const paymentMethod = await this.billingService.attachDefaultPaymentMethodToCustomer(stripePaymentMethodId, stripeCustomer.id);

    // Buy the subscription using the Stripe Customer ID, Stripe Plan ID and Stripe PaymentMethod ID
    const response = await this.billingService.buyNewSubscriptionPlan(stripeCustomer.id, stripePlanId, paymentMethod.id);

    // If we end up here, the subscription is bought.

    return res.json(response);
  };

  /**
   * Changes the default payment method for a customer. 
   * Business rule: a customer can only use one payment method.
   */
  public postOneCustomerPaymentMethod = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;
    const { currentStripePaymentMethodId, newStripePaymentMethodId } = req.body; // The "stripePaymentMethodId" is created on the frontend using Stripe Elements

    if (!newStripePaymentMethodId) {
      throw new HttpError(HttpStatus.BadRequest, 'newStripePaymentMethodId is required.');
    }

    // Verify if the organization already has a customer object
    const customer = await this.organizationService.findOneCustomer(organizationId);

    if (!customer) {
      throw new HttpError(HttpStatus.NotFound, 'Customer for this organization is not found.');
    }

    // Verify if the organization has a Stripe Customer ID
    if (!customer.stripeCustomerId) {
      throw new HttpError(HttpStatus.NotFound, 'Customer for this organization has no billing customer ID.');
    }

    // Verify if the customer exists in Stripe
    const stripeCustomer = await this.billingService.findOneCustomer(customer.stripeCustomerId);

    if (!stripeCustomer) {
      throw new HttpError(HttpStatus.NotFound, 'Customer does not exist on billing service.');
    }

    if (stripeCustomer.deleted) {
      throw new HttpError(HttpStatus.NotFound, 'Customer is already deleted on billing service.');
    }
    
    // First, delete the current payment method
    if (currentStripePaymentMethodId) {
      await this.billingService.deleteOneCustomerPaymentMethod(currentStripePaymentMethodId)
    }

    // Attach the payment method to the customer as a default
    // This payment method will be used for future charges
    const attachPaymentMethodResponse = await this.billingService.attachDefaultPaymentMethodToCustomer(newStripePaymentMethodId, stripeCustomer.id);

    // If we end up here, the payment method is changed.

    return res.json(attachPaymentMethodResponse);
  };

  public getOneCustomerSetupIntent = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    const customer = await this.organizationService.findOneCustomer(organizationId);

    if (!customer) {
      throw new HttpError(HttpStatus.NotFound, 'Customer for this organization is not found.');
    }

    // Verify if the organization has a Stripe Customer ID
    if (!customer.stripeCustomerId) {
      throw new HttpError(HttpStatus.NotFound, 'Customer for this organization has no billing customer ID.');
    }
    
    const setupIntent = await this.billingService.createOneCustomerSetupIntent(customer.stripeCustomerId);

    return res.json(setupIntent);
  }
  
}
