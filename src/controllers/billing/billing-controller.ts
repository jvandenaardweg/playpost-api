import { Request, Response } from 'express';
import { BillingService } from '../../services/billing-service';
import { BaseController } from '../index';
import { HttpError, HttpStatus } from '../../http-error';

export class BillingController extends BaseController {
  billingService: BillingService;

  constructor() {
    super()
    this.billingService = new BillingService();
  }

  /**
   * @swagger
   *
   *  /billing:
   *    get:
   *      operationId: getBillingIndex
   *      tags:
   *        - billing
   *      summary: Index of billing endpoint
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
   *          $ref: '#/components/responses/MessageResponse'
   */
  public getBillingIndex = async (req: Request, res: Response): Promise<Response> => {
    return res.json({
      message: 'OK'
    });
  };

  /**
   * @swagger
   *
   *  /billing/plans:
   *    get:
   *      operationId: getAllBillingPlans
   *      tags:
   *        - billing
   *      summary: Get all Plans from Stripe
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      externalDocs:
   *        url: https://stripe.com/docs/api/plans
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: An array of Stripe Plan's
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/StripePlan'
   */
  public getAllBillingPlans = async (req: Request, res: Response): Promise<Response> => {
    const plans = await this.billingService.findAllPlans();

    return res.json(plans);
  };

  /**
   * @swagger
   *
   *  /billing/plans/{stripePlanId}:
   *    get:
   *      operationId: getOneBillingPlan
   *      tags:
   *        - billing
   *      summary: Gets one subscription plan from Stripe using Stripe subscription Id's.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: stripePlanId
   *          schema:
   *            type: string
   *          required: true
   *          description: A Stripe Plan Id as a string
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: One Stripe Subscription plan
   *          content:
   *            'application/json':
   *              schema:
   *                $ref: '#/components/schemas/StripePlan'
   */
  public getOneBillingPlan = async (req: Request, res: Response): Promise<Response> => {
    const { stripePlanId } = req.params;

    const response = await this.billingService.findOnePlan(stripePlanId);

    return res.json(response);
  };

  /**
   * @swagger
   *
   *  /billing/products:
   *    get:
   *      operationId: getAllBillingProducts
   *      tags:
   *        - billing
   *      summary: Get all Products from Stripe
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
   *          description: An array of Stripe Products's
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/StripeProduct'
   */
  public getAllBillingProducts = async (req: Request, res: Response): Promise<Response> => {
    const response = await this.billingService.findAllProducts();

    return res.json(response);
  };

  /**
   * @swagger
   *
   *  /billing/products/{stripeProductId}:
   *    get:
   *      operationId: getOneBillingProduct
   *      tags:
   *        - billing
   *      summary: Gets one Product from Stripe using Stripe Product Id.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: stripeProductId
   *          schema:
   *            type: string
   *          required: true
   *          description: A Stripe Plan Id as a string
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: One Stripe Product
   *          content:
   *            'application/json':
   *              schema:
   *                $ref: '#/components/schemas/StripeProduct'
   */
  public getOneBillingProduct = async (req: Request, res: Response): Promise<Response> => {
    const { stripeProductId } = req.params;

    const response = await this.billingService.findOneProduct(stripeProductId);

    return res.json(response);
  };

  /**
   * @swagger
   *
   *  /billing/tax-rates:
   *    get:
   *      operationId: getAllBillingTaxRates
   *      tags:
   *        - billing
   *      summary: Get all TaxRate's from Stripe
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
   *          description: An array of Stripe TaxRate's
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/StripeTaxRate'
   */
  public getAllBillingTaxRates = async (req: Request, res: Response): Promise<Response> => {
    const response = await this.billingService.findAllTaxRates();

    return res.json(response);
  };

  /**
   * @swagger
   *
   *  /billing/tax-rate/{stripeTaxRateId}:
   *    get:
   *      operationId: getOneBillingTaxRate
   *      tags:
   *        - billing
   *      summary: Gets one TaxRate from Stripe using Stripe TaxRate Id.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: stripeTaxRateId
   *          schema:
   *            type: string
   *          required: true
   *          description: A Stripe TaxRate Id as a string
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: One Stripe TaxRate
   *          content:
   *            'application/json':
   *              schema:
   *                $ref: '#/components/schemas/StripeTaxRate'
   */
  public getOneBillingTaxRate = async (req: Request, res: Response): Promise<Response> => {
    const { stripeTaxRateId } = req.params;

    const response = await this.billingService.findOneTaxRate(stripeTaxRateId);

    return res.json(response);
  };

  /**
   * @swagger
   *
   *  /billing/tax-number/validate:
   *    post:
   *      operationId: postOneBillingTaxNumberValidation
   *      tags:
   *        - billing
   *      summary: Validates a tax number.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostOneBillingTaxNumberValidationRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: The result when tax number is valid
   *          $ref: '#/components/responses/MessageResponse'
   */
  public postOneBillingTaxNumberValidation = async (req: Request, res: Response): Promise<Response> => {
    const { countryCode, taxNumber } = req.body;

    if (!countryCode) {
      throw new HttpError(HttpStatus.BadRequest, 'countryCode body parameter is required.');
    }

    if (!taxNumber) {
      throw new HttpError(HttpStatus.BadRequest, 'taxNumber body parameter is required.');
    }

    const isValid = await this.billingService.isValidTaxNumber(countryCode, taxNumber);

    if (!isValid) {
      throw new HttpError(HttpStatus.BadRequest, `The given tax ID "${taxNumber}" seems to be invalid.`)
    }

    return res.json({
      message: 'Tax ID is valid.'
    });
  };

  /**
   * @swagger
   *
   *  /billing/sales-tax/{countryCode}:
   *    get:
   *      operationId: getOneBillingSalesTax
   *      tags:
   *        - billing
   *      summary: Gets one Sales Tax response by countryCode.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: countryCode
   *          schema:
   *            type: string
   *          required: true
   *          description: A Country code as a string
   *          example: NL
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: One SalesTax object
   *          content:
   *            'application/json':
   *              schema:
   *                $ref: '#/components/schemas/SalesTax'
   */
  public getOneBillingSalesTax = async (req: Request, res: Response): Promise<Response> => {
    const { countryCode } = req.params;

    if (!countryCode) {
      throw new HttpError(HttpStatus.BadRequest, 'countryCode param is required.');
    }

    const salesTax = await this.billingService.findSalesTax(countryCode);

    return res.json(salesTax);
  };
  
  /**
   * @swagger
   *
   *  /billing/checkout/new:
   *    get:
   *      operationId: postOneBillingCheckoutSessionNew
   *      tags:
   *        - billing
   *      summary: Get a Checkout Sessions for Stripe Checkout for buying a new Subscription
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostOneBillingCheckoutSessionNew'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: One Session object
   *          content:
   *            'application/json':
   *              schema:
   *                $ref: '#/components/schemas/StripeSession'
   */
  public postOneBillingCheckoutSessionNew = async (req: Request, res: Response): Promise<Response> => {
    const { stripeCustomerId, stripePlanId } = req.body;

    if (!stripeCustomerId) {
      throw new HttpError(HttpStatus.BadRequest, 'stripeCustomerId in request body is required.');
    }

    if (!stripePlanId) {
      throw new HttpError(HttpStatus.BadRequest, 'stripePlanId in request body is required.');
    }

    const customer = await this.billingService.findOneCustomer(stripeCustomerId);

    if (!customer) {
      throw new HttpError(HttpStatus.NotFound, 'Customer not found.');
    }

    if (customer.deleted) {
      throw new HttpError(HttpStatus.NotFound, 'Customer is already deleted.');
    }

    const plan = await this.billingService.findOnePlan(stripePlanId)

    if (!plan) {
      throw new HttpError(HttpStatus.NotFound, 'Plan not found.');
    }

    const session = await this.billingService.createNewSubscriptionSession(customer.id, stripePlanId)

    return res.json(session);
  };

  /**
   * @swagger
   *
   *  /billing/checkout/update:
   *    get:
   *      operationId: postOneBillingCheckoutSessionUpdate
   *      tags:
   *        - billing
   *      summary: Get a Checkout Sessions for Stripe Checkout for updating a Subscription
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostOneBillingCheckoutSessionUpdate'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: One Session object
   *          content:
   *            'application/json':
   *              schema:
   *                $ref: '#/components/schemas/StripeSession'
   */
  public postOneBillingCheckoutSessionUpdate = async (req: Request, res: Response): Promise<Response> => {
    const { stripeCustomerId, stripeSubscriptionId } = req.body;

    if (!stripeCustomerId) {
      throw new HttpError(HttpStatus.BadRequest, 'stripeCustomerId in request body is required.');
    }

    if (!stripeSubscriptionId) {
      throw new HttpError(HttpStatus.BadRequest, 'stripeSubscriptionId in request body is required.');
    }

    const customer = await this.billingService.findOneCustomer(stripeCustomerId);

    if (!customer) {
      throw new HttpError(HttpStatus.NotFound, 'Customer not found.');
    }

    if (customer.deleted) {
      throw new HttpError(HttpStatus.NotFound, 'Customer is already deleted.');
    }

    const subscription = await this.billingService.findOneCustomerSubscription(stripeSubscriptionId);

    if (!subscription) {
      throw new HttpError(HttpStatus.NotFound, 'Subscription not found.');
    }

    const session = await this.billingService.createUpdateSubscriptionSession(customer.id, stripeSubscriptionId)

    return res.json(session);
  };
}
