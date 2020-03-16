import joi from '@hapi/joi';
import { NextFunction, Request } from 'express';
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
import { OrganizationResponse, PostOneOrganizationRequestBody, PostOneOrganizationPublicationRequestBody, PatchOneOrganizationCustomerRequestBody, PatchOneCustomerPaymentMethodRequestBody, PostOneOrganizationSubscriptionRequestBody, PostOneOrganizationCustomerPaymentMethodRequestBody, PatchOneOrganizationSubscriptionRequestBody } from './types';
import { Organization } from '../../database/entities/organization';
import { getConnection } from 'typeorm';
import * as uuid from 'uuid';
import { CountryService } from '../../services/country-service';

export class OrganizationsController extends BaseController {
  private organizationService: OrganizationService;
  private usageRecordService: UsageRecordService;
  private billingService: BillingService;
  private usersService: UserService;
  private publicationService: PublicationService;
  private countryService: CountryService;

  constructor() {
    super()
    this.organizationService = new OrganizationService();
    this.usageRecordService = new UsageRecordService();
    this.billingService = new BillingService();
    this.usersService = new UserService()
    this.publicationService = new PublicationService()
    this.countryService = new CountryService()
  }

  /**
   * Handles access permissions.
   */
  public permissions = (roles: PermissionRoles) => {
    return async (req: Request, res: OrganizationResponse, next: NextFunction): Promise<void | OrganizationResponse> => {
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
      const isAdminInOrganization = !!(organization.admin && organization.admin.id === userId);
      const isUserInOrganization = !!(organization.users && organization.users.some(user => user.id === userId));

      if (roles.includes('organization-user') && !isUserInOrganization && !isAdminInOrganization) {
        throw new HttpError(HttpStatus.Forbidden, 'You have no access to this organization.');
      }

      if (roles.includes('organization-admin') && !isAdminInOrganization) {
        throw new HttpError(HttpStatus.Forbidden, 'You have no admin access to this organization.');
      }

      // Pass the user to the controller using locals
      // So we do not have to do additional database request to get the user inside the controller method
      res.locals.organization = organization;
      res.locals.isAdmin = isAdminInOrganization;
      res.locals.isUser = isUserInOrganization;

      return next();
    }
  }

  /**
   * @swagger
   *
   *  /organizations:
   *    get:
   *      operationId: getAllOrganizations
   *      tags:
   *        - organizations
   *      summary: Get the Organizations the user has access to.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: An array of Organization's
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/Organization'
   */
  public getAllOrganizations = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const userId = req.user!.id;

    const response = await this.organizationService.findAllByUserId(userId);

    return res.json(response);
  };

  /**
   * @swagger
   *
   *  /organizations:
   *    post:
   *      operationId: postOneOrganization
   *      tags:
   *        - organizations
   *      summary: Create on Organization for the user.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostOneOrganizationRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: A Organization object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/Organization'
   */
  public postOneOrganization = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const userId = req.user!.id;
    const { name, countryId } = req.body as PostOneOrganizationRequestBody;

    const validationSchema = joi.object().keys({
      name: joi.string().max(50).required(),
      countryId: joi.string().uuid().required()
    });

    const { error } = validationSchema.validate(req.body);

    if (error) {
      throw new HttpError(HttpStatus.BadRequest, error.details[0].message, error.details[0])
    }

    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new HttpError(HttpStatus.NotFound, 'User could not be found.');
    }

    const country = await this.countryService.findOneById(countryId)

    if (!country) {
      throw new HttpError(HttpStatus.NotFound, 'The given country could not be found.');
    }

    // TODO: check if user already has organization, do not allow it to create one if he already has one

    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();

    // establish real database connection using our new query runner
    await queryRunner.connect();

    // Create a transaction to make sure our separate calls finish properly
    await queryRunner.startTransaction();

    const organizationToCreate = new Organization();
    organizationToCreate.name = name;
    organizationToCreate.id = uuid.v4(); // Create a UUID, we can use in our Stripe call

    // Add the current user as an admin
    organizationToCreate.admin = user;
    organizationToCreate.users = [user];
    organizationToCreate.stripeCustomerId = '';

    // First, create the organization without a Stripe Customer ID
    // So we do not end up with unused customers in Stripe when a database insertion failed
    await queryRunner.manager.save(organizationToCreate);

    // First, create a Customer
    const createdCustomer = await this.billingService.createCustomer({
      organizationId: organizationToCreate.id,
      organizationName: organizationToCreate.name,
      countryCode: country.code.toUpperCase(),
      email: user.email,
      userId: user.id,
    })

    // Attach the Stripe Customer ID to the Organization
    organizationToCreate.stripeCustomerId = createdCustomer.id;

    // Update the Organization with the new Stripe Customer ID
    const createdOrganization = await queryRunner.manager.save(organizationToCreate);

    // By wrapping the above in a transaction, we make sure the organization does not get created if we fail to create a customer

    // Commit the transaction
    await queryRunner.commitTransaction();

    await queryRunner.release();

    return res.json(createdOrganization);
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}:
   *    get:
   *      operationId: getOneOrganization
   *      tags:
   *        - organizations
   *      summary: Get one organization belonging to the authenticated user.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: A Organization object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/Organization'
   */
  public getOneOrganization = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { organizationId } = req.params;

    const organization = await this.organizationService.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    return res.json(organization);
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/publications:
   *    get:
   *      operationId: getAllOrganizationPublications
   *      tags:
   *        - organizations
   *      summary: Get the Publications of the Organization
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: An array of Publications
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/Publication'
   */
  public getAllOrganizationPublications = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { organizationId } = req.params;

    const requestQuery = this.validatePagingParams(req.query);
    const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    const publications = await this.organizationService.findAllPublications(organizationId, page, perPage, skip, take);

    return res.json(publications);
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer:
   *    get:
   *      operationId: getOneOrganizationCustomer
   *      tags:
   *        - organizations
   *      summary: Get the Stripe Customer of an Organization
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: A Stripe Customer object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/StripeCustomer'
   */
  public getOneOrganizationCustomer = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const organization = res.locals.organization;

    const stripeCustomer = await this.billingService.findOneCustomer(organization.stripeCustomerId)
    return res.json(stripeCustomer);
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer:
   *    post:
   *      operationId: postOneOrganizationPublication
   *      tags:
   *        - organizations
   *      summary: Creates a publication for the selected organization.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostOneOrganizationPublicationRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: A Publication object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/Publication'
   */
  public postOneOrganizationPublication = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { name, url } = req.body as PostOneOrganizationPublicationRequestBody;
    const userId = req.user!.id;

    const organization = res.locals.organization;

    // When we end up here, the user is allowed to create a publiction for this organization

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
   * @swagger
   *
   *  /organizations/{organizationId}/publications/{publicationId}:
   *    delete:
   *      operationId: deleteOneOrganizationPublication
   *      tags:
   *        - organizations
   *      summary: Deletes a Publication from the selected Organization.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *        - in: path
   *          name: publicationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Publication
   *          example: 5ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        204:
   *          description: Just a NoContent response
   */
  public deleteOneOrganizationPublication = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { publicationId } = req.params;

    const publication = await this.publicationService.findOneById(publicationId);

    if (!publication) {
      throw new HttpError(HttpStatus.NotFound, 'The publication does not exist.');
    }

    // TODO: delete publication articles
    // TODO: delete publication audiofiles

    await this.publicationService.remove(publication);

    return res.status(HttpStatus.NoContent).send();
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer:
   *    patch:
   *      operationId: patchOneOrganizationCustomer
   *      tags:
   *        - organizations
   *      summary: Updates the Stripe Customer attached to this Organization
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PatchOneOrganizationCustomerRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: A Stripe Customer object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/StripeCustomer'
   */
  public patchOneOrganizationCustomer = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { organizationId } = req.params;
    const requestBody: PatchOneOrganizationCustomerRequestBody = req.body;

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
      }).required(),
      // Tax ID is optional, it's not required for non-business customers
      taxId: joi.object().keys({
        value: joi.string().allow('').optional().max(20), // Example: "NL002175463B65"
      })
    });

    const { error } = validationSchema.validate(requestBody);

    if (error) {
      throw new HttpError(HttpStatus.BadRequest, error.details[0].message, error.details[0])
    }

    const customerUpdateParams: Stripe.CustomerUpdateParams = {
      email: requestBody.email,
      name: requestBody.name,
      address: {
        line1: requestBody.address.line1,
        line2: requestBody.address.line2,
        city: requestBody.address.city,
        postal_code: requestBody.address.postal_code,
        state: requestBody.address.state,
        country: requestBody.address.country,
      }
    }

    const updatedCustomer = await this.organizationService.updateOneCustomer(organizationId, customerUpdateParams, requestBody.taxId.value);

    return res.json(updatedCustomer);
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer/subscriptions:
   *    get:
   *      operationId: getAllOrganizationCustomerSubscriptions
   *      tags:
   *        - organizations
   *      summary: Get the Subscriptions of a Customer
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: An array of Stripe Subscriptions
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/StripeSubscription'
   */
  public getAllOrganizationCustomerSubscriptions = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { organizationId } = req.params;

    const customerSubscriptions = await this.organizationService.findAllCustomerSubscriptions(organizationId);

    if (!customerSubscriptions) {
      return res.json([]);
    }

    return res.json(customerSubscriptions);
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer/invoices:
   *    get:
   *      operationId: getAllOrganizationCustomerInvoices
   *      tags:
   *        - organizations
   *      summary: Get the Invoices of a Customer
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: An array of Stripe Subscriptions
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/StripeInvoice'
   */
  public getAllOrganizationCustomerInvoices = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { organizationId } = req.params;

    const [customerInvoices, customerUpcomingInvoice] = await Promise.all([
      this.organizationService.findAllCustomerInvoices(organizationId),
      this.organizationService.findOneCustomerInvoiceUpcoming(organizationId)
    ]);

    if (!customerInvoices) {
      return res.json([])
    }

    // If there is no upcoming invoice, just return the normal invoices
    if (!customerUpcomingInvoice) {
      return res.json(customerInvoices)
    }

    // Merge the upcoming invoice in the other invoices
    const invoices: Stripe.Invoice[] = [
      customerUpcomingInvoice,
      ...customerInvoices.data,
    ]

    return res.json(invoices);
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer/payment-methods:
   *    get:
   *      operationId: getAllOrganizationCustomerPaymentMethods
   *      tags:
   *        - organizations
   *      summary: Get the Invoices of a Customer
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: An array of Stripe Subscriptions
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/StripePaymentMethod'
   */
  public getAllOrganizationCustomerPaymentMethods = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const organization = res.locals.organization;

    const customerPaymentMethods = await this.billingService.findAllCustomerPaymentMethods(organization.stripeCustomerId);

    return res.json(customerPaymentMethods);
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer/payment-methods:
   *    post:
   *      operationId: postOneOrganizationCustomerPaymentMethod
   *      tags:
   *        - organizations
   *      summary: Changes the default payment method for a customer, a customer can only use one payment method.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostOneOrganizationCustomerPaymentMethodRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: An array of Stripe Subscriptions
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/StripePaymentMethod'
   */
  public postOneOrganizationCustomerPaymentMethod = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { newStripePaymentMethodId } = req.body as PostOneOrganizationCustomerPaymentMethodRequestBody; // The "stripePaymentMethodId" is created on the frontend using Stripe Elements

    const validationSchema = joi.object().keys({
      newStripePaymentMethodId: joi
        .string()
        .required()
    });

    const { error } = validationSchema.validate(req.body);

    if (error) {
      throw new HttpError(HttpStatus.BadRequest, error.details[0].message, error.details[0])
    }

    const organization = res.locals.organization;

    // Verify if the customer exists in Stripe
    const stripeCustomer = await this.billingService.findOneCustomer(organization.stripeCustomerId);

    if (!stripeCustomer) {
      throw new HttpError(HttpStatus.NotFound, 'Customer does not exist on billing service.');
    }

    if (stripeCustomer.deleted) {
      throw new HttpError(HttpStatus.NotFound, 'Customer is already deleted on billing service.');
    }

    const currentPaymentMethodId = stripeCustomer.invoice_settings.default_payment_method;
    
    // First, delete the current payment method
    if (currentPaymentMethodId && typeof currentPaymentMethodId === 'string') {
      await this.billingService.deleteOneCustomerPaymentMethod(currentPaymentMethodId)
    }

    // Attach the payment method to the customer as a default
    // This payment method will be used for future charges
    const attachPaymentMethodResponse = await this.billingService.attachDefaultPaymentMethodToCustomer(newStripePaymentMethodId, stripeCustomer.id);

    // If we end up here, the payment method is changed.

    return res.status(HttpStatus.Created).json(attachPaymentMethodResponse);
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer/payment-methods/{stripePaymentMethodId}:
   *    patch:
   *      operationId: patchOneOrganizationCustomerPaymentMethod
   *      tags:
   *        - organizations
   *      summary: Get the Invoices of a Customer
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *        - in: path
   *          name: stripePaymentMethodId
   *          schema:
   *            type: string
   *          required: true
   *          description: A Stripe Payment Method ID
   *          example: pm_1GCRSVLbygOvfi9ojuY8DFOq
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PatchOneCustomerPaymentMethodRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: An array of Stripe Subscriptions
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/StripePaymentMethod'
   */
  public patchOneOrganizationCustomerPaymentMethod = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { stripePaymentMethodId } = req.params;
    const { billingDetailsName, cardExpireMonth, cardExpireYear } = req.body as PatchOneCustomerPaymentMethodRequestBody;

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

    const organization = res.locals.organization;

    // Find the current payment method to verify it's existence
    const currentPaymentMethod = await this.billingService.findOnePaymentMethod(stripePaymentMethodId);

    if (!currentPaymentMethod) {
      throw new HttpError(HttpStatus.NotFound, 'Current payment method not found.');
    }

    // Check if the payment method belongs to the customer
    if (currentPaymentMethod.customer !== organization.stripeCustomerId) {
      throw new HttpError(HttpStatus.BadRequest, 'This payment method does not belong to the customer.');
    }

    // All good, we can update the payment method information

    const updatedPaymentMethod = await this.billingService.updateOneCustomerPaymentMethod(stripePaymentMethodId, billingDetailsName, cardExpireMonth, cardExpireYear);

    return res.json(updatedPaymentMethod);
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer/subscriptions/{stripeSubscriptionId}:
   *    delete:
   *      operationId: deleteOneOrganizationSubscription
   *      tags:
   *        - organizations
   *      summary: Delete (cancel) a subscription using the Stripe subscription ID.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *        - in: path
   *          name: stripeSubscriptionId
   *          schema:
   *            type: string
   *          required: true
   *          description: A Stripe Subscription ID
   *          example: sub_1GCRSVLbygOvfi9ojuY8DFOq
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: The cancelled Stripe Subscription
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/StripeSubscription'
   */
  public deleteOneOrganizationSubscription = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { stripeSubscriptionId } = req.params;

    const validationSchema = joi.object().keys({
      stripeSubscriptionId: joi
        .string()
        .required()
    });

    const { error } = validationSchema.validate(req.body);

    if (error) {
      throw new HttpError(HttpStatus.BadRequest, error.details[0].message, error.details[0])
    }

    const cancelSubscriptionResult = await this.organizationService.cancelSubscription(stripeSubscriptionId);

    return res.json(cancelSubscriptionResult);
  }
  
  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer/subscriptions/{stripeSubscriptionId}:
   *    patch:
   *      operationId: patchOneOrganizationSubscription
   *      tags:
   *        - organizations
   *      summary: Upgrades or Downgrades an active Stripe Subscription
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *        - in: path
   *          name: stripeSubscriptionId
   *          schema:
   *            type: string
   *          required: true
   *          description: A Stripe Subscription ID
   *          example: sub_1GCRSVLbygOvfi9ojuY8DFOq
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PatchOneOrganizationSubscriptionRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: The new Stripe Subscription
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/StripeSubscription'
   */
  public patchOneOrganizationSubscription = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { stripeSubscriptionId } = req.params;
    const { newStripePlanId } = req.body as PatchOneOrganizationSubscriptionRequestBody;

    const validationSchema = joi.object().keys({
      newStripePlanId: joi
        .string()
        .required(),
        stripeSubscriptionId: joi
        .string()
        .required()
    });

    const { error } = validationSchema.validate(req.body);

    if (error) {
      throw new HttpError(HttpStatus.BadRequest, error.details[0].message, error.details[0])
    }

    const upgradeOrDowngradeSubscriptionResult = await this.billingService.upgradeOrDowngradeSubscription(stripeSubscriptionId, newStripePlanId)

    return res.json(upgradeOrDowngradeSubscriptionResult);
  }

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer/subscriptions:
   *    post:
   *      operationId: postOneOrganizationSubscription
   *      tags:
   *        - organizations
   *      summary: Buys a new subscription plan on behalf of the organization.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostOneOrganizationSubscriptionRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: A Stripe Subscription object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/StripeSubscription'
   */
  public postOneOrganizationSubscription = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { stripePlanId, stripePaymentMethodId, stripeTaxRateId, customTrialEndDate } = req.body as PostOneOrganizationSubscriptionRequestBody; // The "stripePaymentMethodId" is created on the frontend using Stripe Elements

    if (!stripePlanId) {
      throw new HttpError(HttpStatus.BadRequest, 'stripePlanId is required.');
    }

    if (!stripePaymentMethodId) {
      throw new HttpError(HttpStatus.BadRequest, 'stripePaymentMethodId is required.');
    }

    const organization = res.locals.organization;

    // Verify if the customer exists in Stripe
    const stripeCustomer = await this.billingService.findOneCustomer(organization.stripeCustomerId);

    if (!stripeCustomer || stripeCustomer.deleted) {
      throw new HttpError(HttpStatus.NotFound, 'Customer does not exist on billing service.');
    }

    const isAlreadySubscribed = stripeCustomer.subscriptions && stripeCustomer.subscriptions.data.some(subscription => subscription.plan && subscription.plan.id === stripePlanId);

    if (isAlreadySubscribed) {
      throw new HttpError(HttpStatus.Conflict, 'You are already subscribed to this subscription plan.');
    }

    // Make sure the customer has a default payment method
    if (!stripeCustomer.invoice_settings.default_payment_method) {
      throw new HttpError(HttpStatus.NotFound, 'Customer has no default payment method.');
    }

    // Verify if the subscription plan exists
    const stripePlan = await this.billingService.findOnePlan(stripePlanId);

    if (!stripePlan) {
      throw new HttpError(HttpStatus.NotFound, 'Subscription plan does not exist on billing service.');
    }

    // The PaymentMethod ID we receive here, has to be authenticated to be used for "off_session" payments.
    // So we do not require authentication when we charge the user's card in the future.
    // This authentication has to be done in the frontend using Stripe's confirmCardSetup method.
    // Docs: https://stripe.com/docs/js/setup_intents/confirm_card_setup

    // Attach the payment method to the customer as a default
    // This payment method will be used for future charges
    // const paymentMethod = await this.billingService.attachDefaultPaymentMethodToCustomer(stripePaymentMethodId, stripeCustomer.id);

    // Buy the subscription using the Stripe Customer ID, Stripe Plan ID and Stripe PaymentMethod ID
    const subscriptionResult = await this.billingService.buyNewSubscriptionPlan(stripeCustomer.id, stripePlanId, stripeTaxRateId, customTrialEndDate);

    // If we end up here, the subscription is bought.

    return res.json(subscriptionResult);
  };

  /**
   * @swagger
   *
   *  /organizations/{organizationId}/customer/setup-intent:
   *    get:
   *      operationId: getOneOrganizationCustomerSetupIntent
   *      tags:
   *        - organizations
   *      summary: Get's a Stripe Setup Intent.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: organizationId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of the Organization
   *          example: 4ba0fa30-ea6d-46b8-b31c-2e65fc328b11
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: A Stripe Setup Intent object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/StripeSetupIntent'
   */
  public getOneOrganizationCustomerSetupIntent = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const organization = res.locals.organization;
    
    const setupIntent = await this.billingService.createOneCustomerSetupIntent(organization.stripeCustomerId);

    return res.json(setupIntent);
  }


  public getAllOrganizationCustomerTaxIds = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const organization = res.locals.organization;
    
    const customerTaxIds = await this.billingService.findAllCustomerTaxIds(organization.stripeCustomerId);

    return res.json(customerTaxIds);
  }

  public postOneCustomerTaxId = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { stripeTaxIdType, stripeTaxIdValue } = req.body;
    const organization = res.locals.organization;
    
    const customerTaxIds = await this.billingService.createOneCustomerTaxId(organization.stripeCustomerId, stripeTaxIdType, stripeTaxIdValue);

    return res.status(HttpStatus.Created).json(customerTaxIds);
  }

  public deleteOneCustomerTaxId = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { stripeTaxId } = req.params;
    const organization = res.locals.organization;
    
    const deletedCustomerTaxId = await this.billingService.deleteOneCustomerTaxId(organization.stripeCustomerId, stripeTaxId);

    return res.json(deletedCustomerTaxId);
  }

  /**
   * Get the admin user of the organization.
   */
  public getOneAdmin = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { organizationId } = req.params;

    const admin = await this.organizationService.findOneAdmin(organizationId);

    if (!admin) {
      throw new HttpError(HttpStatus.NotFound, 'Admin for this organization does not exist.');
    }

    return res.json(admin);
  };

  /**
   * Get all users within the organization.
   */
  public getAllUsers = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { organizationId } = req.params;

    const requestQuery = this.validatePagingParams(req.query);
    const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    const users = await this.organizationService.findAllUsers(organizationId, page, perPage, skip, take);

    return res.json(users);
  };                                                     

  /**
   * Changes the admin of this organization. The user must already exist.
   * Only admins of an organization can do this.
   */
  public putOneAdmin = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    // const { organizationId } = req.params;
    const { newAdminUserId } = req.body;
    const userId = req.user!.id;
    const organization = res.locals.organization;

    if (userId === newAdminUserId) {
      throw new HttpError(HttpStatus.BadRequest, 'This user is already an admin of this organization.');
    }

    const updatedOrganization = await this.organizationService.saveAdmin(organization, newAdminUserId);

    return res.json(updatedOrganization);
  };

  /**
   * Associates a existing user to an organization
   */
  public createOneUser = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    // const { organizationId } = req.params;
    const { email } = req.body;
    const organization = res.locals.organization;

    const newUser = await this.usersService.findOneByEmail(email);

    if (!newUser) {
      throw new HttpError(HttpStatus.NotFound, 'A user with that email address does not exist.');
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

  public deleteOneUser = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { userId } = req.params;
    const organization = res.locals.organization;

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

  public getOneCustomerSubscription = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { stripeSubscriptionId } = req.params;

    const customerSubscription = await this.organizationService.findOneCustomerSubscription(stripeSubscriptionId);

    return res.json(customerSubscription);
  };

  public getAllCustomerSubscriptionItems = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { stripeSubscriptionId } = req.params;

    const customerSubscriptionItems = await this.organizationService.findAllCustomerSubscriptionItems(stripeSubscriptionId);

    return res.json(customerSubscriptionItems);
  };

  public getAllCustomerUsageRecordsSummaries = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { stripeSubscriptionItemId } = req.params;

    const customerUsageRecordsSummaries = await this.organizationService.findAllCustomerSubscriptionItemsUsageRecordsSummaries(stripeSubscriptionItemId);

    return res.json(customerUsageRecordsSummaries);
  };

  public getAllCustomerUsageRecords = async (req: Request, res: OrganizationResponse): Promise<OrganizationResponse> => {
    const { stripeSubscriptionItemId } = req.params;

    const customerUsageRecords = await this.usageRecordService.findAllBySubscriptionItemId(stripeSubscriptionItemId, 1, 99999, 0, 99999)

    return res.json(customerUsageRecords);
  };
}
