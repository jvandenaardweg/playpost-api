import Stripe from 'stripe';
import SalesTax from 'sales-tax';

import { stripe } from '../billing';
import { BaseService } from './index';

interface SalesTax {
  type: string;
  rate: number;
  area: 'worldwide' | 'regional' | 'national';
  exchange: 'business' | 'consumer';
  charge: {
    direct: boolean;
    reverse: boolean;
  }
}

export class BillingService extends BaseService {
  private readonly stripe: Stripe;
  private readonly SalesTax: any;

  constructor () {
    super()

    this.stripe = stripe;

    // IMPORTANT: Set this
    // https://github.com/valeriansaliou/node-sales-tax#white_check_mark-specify-the-country-you-charge-from
    SalesTax.setTaxOriginCountry('NL');

    // Enable hitting against external APIs to verify tax numbers against fraud
    // Important: might cause delays
    // SalesTax.toggleEnabledTaxNumberFraudCheck(true);
    // SalesTax.toggleEnabledTaxNumberValidation(false);
    
    this.SalesTax = SalesTax
  }

  async findAllProducts(): Promise<Stripe.Product[]> {
    const products = await this.stripe.products.list();

    return products.data;
  }

  async findOneProduct(stripeProductId: string): Promise<Stripe.Product> {
    const product = await this.stripe.products.retrieve(stripeProductId);

    return product;
  }

  async findAllPlans(): Promise<Stripe.Plan[]> {
    const plans = await this.stripe.plans.list()

    return plans.data;
  }

  async findOnePlan(stripePlanId: string): Promise<Stripe.Plan> {
    const plan = await this.stripe.plans.retrieve(stripePlanId)

    return plan;
  }

  async findAllTaxRates(): Promise<Stripe.TaxRate[]> {
    // The correct taxRate type does not seem to exist when we added this
    // TODO: check for new Stripe types version
    // @ts-ignore
    const taxRates = await this.stripe.taxRates.list();

    return taxRates.data;
  }

  async findOneTaxRate(stripeTaxRateId: string): Promise<Stripe.TaxRate> {
    // The correct taxRate type does not seem to exist when we added this
    // TODO: check for new Stripe types version
    // @ts-ignore
    const taxRate = await this.stripe.taxRates.retrieve(stripeTaxRateId);

    return taxRate;
  }

  /**
   * Get's a Customer from Stripe. This Customer object includes the active subscription.
   * 
   * @param stripeCustomerId 
   */
  async findOneCustomer(stripeCustomerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    const customer = await this.stripe.customers.retrieve(stripeCustomerId);

    if (customer.deleted) {
      return customer;
    }

    return customer;
  }

  async findOneCustomerSubscriptions(stripeCustomerId: string): Promise<Stripe.Subscription[]> {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId
    });

    return subscriptions.data;
  }

  async findAllCustomerPaymentMethods(stripeCustomerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card'
    });

    return paymentMethods.data;
  }

  async deleteOneCustomerPaymentMethod(stripePaymentMethodId: string): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.detach(stripePaymentMethodId);

    return paymentMethod;
  }

  /**
   * Creates a SetupIntent for a customer, useful for saving credit card details for future payments
   * Docs: https://stripe.com/docs/payments/save-and-reuse
   */
  async createOneCustomerSetupIntent(stripeCustomerId: string): Promise<Stripe.SetupIntent> {
    const setupIntent = await this.stripe.setupIntents.create({
      usage: 'off_session', // Allow to use the credit card without the user needing to do something
      customer: stripeCustomerId,
    });

    return setupIntent;
  }

  async findOnePaymentMethod(stripePaymentMethodId: string): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.retrieve(stripePaymentMethodId);

    return paymentMethod;
  }

  async updateOneCustomerPaymentMethod(stripePaymentMethodId: string, billingDetailsName: string, cardExpireMonth: number, cardExpireYear: number): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.update(stripePaymentMethodId, {
      billing_details: {
        name: billingDetailsName
      },
      card: {
        exp_month: cardExpireMonth,
        exp_year: cardExpireYear
      }
    })

    return paymentMethod;
  }

  async findOneCustomerSubscriptionStatus(stripeCustomerId: string): Promise<Stripe.Subscription.Status | null> {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId
    });

    if (subscriptions.data.length) {
      return subscriptions.data[0].status
    }

    // If there is no active subscription, it's either "canceled", or the customer was not a subscriber before

    // TODO: handle scenario where customer was not a subscriber before
    return null
  }

  /**
   * Method to buy a new subscription plan when the user has no subscription yet.
   * @param stripeCustomerId
   * @param stripePlanId 
   */
  async buyNewSubscriptionPlan(stripeCustomerId: string, stripePlanId: string, customTrialEndDate?: number | 'now'): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          plan: stripePlanId,
        }
      ], 
      trial_end: customTrialEndDate, // Use a custom trial end date to allow to skip the trial, useful when developing. Should not need this in production.
      expand: ['latest_invoice.payment_intent'],
      // default_payment_method: stripePaymentMethodId, // Important: do not use this, so Stripe will use the payment method on the Customer object. Which is what we prefer.
    });

    return subscription
  }

  /**
   * Attaches an existing Stripe PaymentMethod to a Stripe Customer. Sets the PaymentMethod as a default.
   * 
   * Docs: https://stripe.com/docs/api/payment_methods/attach
   *
   * @param stripePaymentMethodId
   * @param stripeCustomerId 
   */
  async attachDefaultPaymentMethodToCustomer(stripePaymentMethodId: string, stripeCustomerId: string): Promise<Stripe.PaymentMethod> {
    // Attach the Payment Method to the Customer
    const paymentMethod = await stripe.paymentMethods.attach(stripePaymentMethodId, {
      customer: stripeCustomerId,
    });

    // Set as the default Payment Method for the Customer
    // This is a required step, so the subscription uses the payment method on the Customer object, instead of the Payment Method on the subscription object
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: stripePaymentMethodId,
      }
    })

    return paymentMethod
  }

  async createOneCustomerTaxId(stripeCustomerId: string, taxIdType: Stripe.TaxIdCreateParams.Type, value: string): Promise<Stripe.TaxId> {
    const createdTaxId = await stripe.customers.createTaxId(stripeCustomerId, {
      type: taxIdType,
      value,
    })

    return createdTaxId;
  }

  async deleteOneCustomerTaxId(stripeCustomerId: string, stripeTaxId: string): Promise<Stripe.DeletedTaxId> {
    const deletedTaxId = await stripe.customers.deleteTaxId(stripeCustomerId, stripeTaxId);

    return deletedTaxId;
  }

  async findAllCustomerTaxIds(stripeCustomerId: string): Promise<Stripe.TaxId[]> {
    const taxIds = await stripe.customers.listTaxIds(stripeCustomerId);

    return taxIds.data;
  }

  async isValidTaxNumber(countryCode: string, taxNumber: string): Promise<boolean> {
    // https://github.com/valeriansaliou/node-sales-tax#white_check_mark-validate-tax-number-for-a-customer

    const isValid: boolean = await this.SalesTax.validateTaxNumber(countryCode, taxNumber)

    return isValid
  }

  async findSalesTax(countryCode: string): Promise<SalesTax> {
    const salesTax = await this.SalesTax.getSalesTax(countryCode);

    return salesTax;
  }
}
