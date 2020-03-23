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

interface CreateStripeCustomerOptions {
  organizationName: string;
  countryCode: string; 
  email: string;
  organizationId: string;
  userId: string;
}

interface SelectTaxIdOption {
  countryName: string;
  description: string;
  type: Stripe.TaxIdCreateParams.Type;
}

interface TaxIdTypes {
  [key: string]: SelectTaxIdOption[];
}

export class BillingService extends BaseService {
  private readonly stripe: Stripe;
  private readonly SalesTax: any;
  public readonly taxIdTypes: TaxIdTypes;

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
    
    this.taxIdTypes = {
      'CA': [
        {
          countryName: 'Canada',
          description: 'CA BN',
          type: 'ca_bn',
        },
        {
          countryName: 'Canada',
          description: 'CA QST',
          type: 'ca_qst',
        }
      ],
      'AU': [
        {
          countryName: 'Australian',
          description: 'AU ABN',
          type: 'au_abn'
        }
      ],
      'ES': [
        {
          countryName: 'Spain',
          description: 'ES CIF',
          type: 'es_cif'
        },
        {
          countryName: 'Spain',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'AS': [
        {
          countryName: 'Austria',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'BE': [
        {
          countryName: 'Belgium',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'BG': [
        {
          countryName: 'Bulgaria',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'CY': [
        {
          countryName: 'Cyprus',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'CZ': [
        {
          countryName: 'Czech',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'DE': [
        {
          countryName: 'Germany',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'DK': [
        {
          countryName: 'Denmark',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'EE': [
        {
          countryName: 'Estonia',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'FI': [
        {
          countryName: 'Finland',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'UK': [
        {
          countryName: 'United Kingdom',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'GR': [
        {
          countryName: 'Greece',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'HR': [
        {
          countryName: 'Croatia',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'HU': [
        {
          countryName: 'Hungary',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'IE': [
        {
          countryName: 'Ireland',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'IT': [
        {
          countryName: 'Italy',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'LT': [
        {
          countryName: 'Lithuania',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'LU': [
        {
          countryName: 'Luxembourg',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'LV': [
        {
          countryName: 'Latvia',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'MT': [
        {
          countryName: 'Malta',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'NL': [
        {
          countryName: 'Netherlands',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'PL': [
        {
          countryName: 'Poland',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'PT': [
        {
          countryName: 'Portugal',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'RO': [
        {
          countryName: 'Romania',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'SE': [
        {
          countryName: 'Sweden',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'SI': [
        {
          countryName: 'Slovenia',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'SK': [
        {
          countryName: 'Slovakia',
          description: 'EU VAT',
          type: 'eu_vat'
        }
      ],
      'HK': [
        {
          countryName: 'Hong Kong',
          description: 'HK BR',
          type: 'hk_br'
        }
      ],
      'IN': [
        {
          countryName: 'India',
          description: 'IN GST',
          type: 'in_gst'
        }
      ],
      'JP': [
        {
          countryName: 'Japan',
          description: 'JP CN',
          type: 'jp_cn'
        }
      ],
      'KR': [
        {
          countryName: 'South Korea',
          description: 'KR BRN',
          type: 'kr_brn'
        }
      ],
      'LI': [
        {
          countryName: 'Liechtenstein',
          description: 'LI UID',
          type: 'li_uid'
        }
      ],
      'MX': [
        {
          countryName: 'Mexico',
          description: 'MX RFC',
          type: 'mx_rfc'
        }
      ],
      'MY': [
        {
          countryName: 'Malaysia',
          description: 'MY ITN',
          type: 'my_itn'
        }
      ],
      'NO': [
        {
          countryName: 'Norway',
          description: 'NO VAT',
          type: 'no_vat'
        }
      ],
      'NZ': [
        {
          countryName: 'New Zealand',
          description: 'NZ GST',
          type: 'nz_gst'
        }
      ],
      'RU': [
        {
          countryName: 'Russia',
          description: 'RU INN',
          type: 'ru_inn'
        }
      ],
      'SG': [
        {
          countryName: 'Singapore',
          description: 'SG UEN',
          type: 'sg_uen'
        }
      ],
      'TH': [
        {
          countryName: 'Thailand',
          description: 'TH VAT',
          type: 'th_vat'
        }
      ],
      'TW': [
        {
          countryName: 'Taiwan',
          description: 'TW VAT',
          type: 'tw_vat'
        }
      ],
      'US': [
        {
          countryName: 'United States',
          description: 'US EIN',
          type: 'us_ein'
        }
      ],
      'ZA': [
        {
          countryName: 'South Africa',
          description: 'ZA VAT',
          type: 'za_vat'
        }
      ]
    }
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
    const taxRates = await this.stripe.taxRates.list({
      limit: 100 // list all
    });

    return taxRates.data;
  }

  async findOneTaxRate(stripeTaxRateId: string): Promise<Stripe.TaxRate> {
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
  /**
   * Method to buy a new subscription plan when the user has no subscription yet.
   * @param stripeCustomerId
   * @param stripePlanId 
   */
  async createOneSubscription(stripeCustomerId: string, stripePlanId: string, stripeTaxRateId?: string, customTrialEndDate?: number | 'now'): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.create({
      customer: stripeCustomerId,
      trial_from_plan: customTrialEndDate ? false : true, // If we have a custom trial end date, do not use the trial from plan we've set up in Stripe
      collection_method: 'charge_automatically', // default
      off_session: true, // Indicates if a customer is on or off-session while an invoice payment is attempted.
      items: [
        {
          plan: stripePlanId,
          ...(stripeTaxRateId) ? { tax_rates: [stripeTaxRateId] } : {},
        }
      ], 
      ...(customTrialEndDate) ? { trial_end: customTrialEndDate } : {}, // Use a custom trial end date to allow to skip the trial, useful when developing. Should not need this in production.
      expand: ['latest_invoice.payment_intent'],
      // default_payment_method: stripePaymentMethodId, // Important: do not use this, so Stripe will use the payment method on the Customer object. Which is what we prefer.
    });

    return subscription
  }

  /**
   * Update a subscription
   * https://stripe.com/docs/billing/subscriptions/upgrading-downgrading
   */
  async upgradeOrDowngradeSubscription(currentStripeSubscriptionId: string, newStripePlanId: string, stripeTaxRateId?: string, customTrialEndDate?: number | 'now'): Promise<Stripe.Subscription> {
    const currentSubscription = await this.stripe.subscriptions.retrieve(currentStripeSubscriptionId);

    if (!currentSubscription) {
      throw new Error('Customer has no subscription.');
    }
    
    const currentSubscriptionPlanId = currentSubscription.items.data[0].plan.id;

    if (newStripePlanId === currentSubscriptionPlanId) {
      throw new Error('Cannot upgrade or downgrade this subscription, because the plan is the same.');
    }

    const updatedSubscription = await this.stripe.subscriptions.update(currentSubscription.id, {
      cancel_at_period_end: false,
      items: [{
        id: currentSubscription.items.data[0].id, // Stripe Subscription Item ID
        plan: newStripePlanId,
        ...(stripeTaxRateId) ? { tax_rates: [stripeTaxRateId] } : {},
      }],
      ...(customTrialEndDate) ? { trial_end: customTrialEndDate } : {}, // Use a custom trial end date to allow to skip the trial, useful when developing. Should not need this in production.
      expand: ['latest_invoice.payment_intent'],
    })

    return updatedSubscription;
  }

  async updateSubscription(currentStripeSubscriptionId: string, params?: Stripe.SubscriptionUpdateParams | undefined): Promise<Stripe.Subscription> {
    const updatedSubscription = await this.stripe.subscriptions.update(currentStripeSubscriptionId, params)

    return updatedSubscription;
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
    const paymentMethod = await this.stripe.paymentMethods.attach(stripePaymentMethodId, {
      customer: stripeCustomerId,
    });

    // Set as the default Payment Method for the Customer
    // This is a required step, so the subscription uses the payment method on the Customer object, instead of the Payment Method on the subscription object
    await this.stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: stripePaymentMethodId,
      },
    })

    return paymentMethod
  }

  async createOneCustomerTaxId(stripeCustomerId: string, params: Stripe.TaxIdCreateParams): Promise<Stripe.TaxId> {
    const createdTaxId = await this.stripe.customers.createTaxId(stripeCustomerId, params)

    return createdTaxId;
  }

  async deleteOneCustomerTaxId(stripeCustomerId: string, stripeTaxId: string): Promise<Stripe.DeletedTaxId> {
    const deletedTaxId = await this.stripe.customers.deleteTaxId(stripeCustomerId, stripeTaxId);

    return deletedTaxId;
  }

  async findAllCustomerTaxIds(stripeCustomerId: string): Promise<Stripe.TaxId[]> {
    const taxIds = await this.stripe.customers.listTaxIds(stripeCustomerId);

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

  async createOneCustomer(options: CreateStripeCustomerOptions): Promise<Stripe.Customer> {
    const createdCustomer = await this.stripe.customers.create({
      name: options.organizationName,
      address: {
        country: options.countryCode,
        line1: '',
      },
      email: options.email,
      preferred_locales: ['en'],
      metadata: {
        organizationId: options.organizationId,
        adminEmail: options.email,
        userId: options.userId,
      }
    })

    return createdCustomer
  }

  async updateOneCustomer(stripeCustomerId: string, params?: Stripe.CustomerUpdateParams | undefined) {
    const updateResult = await this.stripe.customers.update(stripeCustomerId, params);

    return updateResult;
  }

  async findOneCustomerSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
    return subscription;
  }

  /**
   * Find all the subscriptions of the organization customer.
   *
   * @param organizationId
   */
  async findAllCustomerSubscriptions(stripeCustomerId: string): Promise<Stripe.Subscription[]> {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: stripeCustomerId,
      // Also get the complete product, customer and latest invoice object's
      // So we do not need to do seperate calls to Stripe to get these required details we want to present to our users
      expand: ['data.plan.product', 'data.customer', 'data.latest_invoice'],
      status: 'all'
    });

    return subscriptions.data;
  }

  async createOneUsageRecord(stripeSubscriptionItemId: string, params: Stripe.UsageRecordCreateParams): Promise<Stripe.UsageRecord> {
    const createdStripeUsageRecord = await this.stripe.subscriptionItems.createUsageRecord(stripeSubscriptionItemId, params);

    return createdStripeUsageRecord;
  }

  /**
   * Cancels a customer's subscription immediately. The customer will not be charged again for the subscription.
   *
   * Pending invoices will be charged at the end of the period.
   *
   * @param stripeSubscriptionId
   */
  async cancelOneSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription> {
    const subscriptions = await this.stripe.subscriptions.del(stripeSubscriptionId)

    return subscriptions;
  }

  /**
   * Find all customer invoices of the organization.
   *
   * @param organizationId
   */
  async findAllCustomerInvoices(stripeCustomerId: string): Promise<Stripe.ApiList<Stripe.Invoice>> {
    const invoices = await this.stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 24 // 2 years when subscription is a monthly plan
    })

    return invoices;
  }

  /**
   * Find all upcoming invoices for the customer.
   *
   * @param organizationId
   */
  async findOneCustomerInvoiceUpcoming(stripeCustomerId: string): Promise<Stripe.Invoice | undefined> {
    try {
      const invoicesUpcoming = await this.stripe.invoices.retrieveUpcoming({
        customer: stripeCustomerId
      })

      return invoicesUpcoming;
    } catch (err) {
      // If there is no upcoming invoice, just return undefined
      if (err.raw.code === 'invoice_upcoming_none') {
        return undefined;
      }

      // Else, just throw the api error we get from Stripe
      throw err;
    }
  }
}
