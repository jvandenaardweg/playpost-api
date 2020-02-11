import Stripe from 'stripe';

import { stripe } from '../billing';
import { BaseService } from './index';

export class BillingService extends BaseService {
  private readonly stripe: Stripe;

  constructor () {
    super()

    this.stripe = stripe;
  }

  async findAllProducts(): Promise<Stripe.Product[]> {
    const products = await this.stripe.products.list();

    return products.data;
  }

  async findAllProductsWithPlans(): Promise<Stripe.Product[]> {
    // Get products an plans together
    const [products, plans] = await Promise.all([
      this.stripe.products.list(),
      this.stripe.plans.list()
    ]);

    const productsWithPlans = products.data.map(product => {
      const matchingPlans = plans.data.filter(plan => plan.product === product.id);

      return {
        ...product,
        plans: matchingPlans
      }
    })

    return productsWithPlans;
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
    const plans = await this.stripe.plans.retrieve(stripePlanId)

    return plans;
  }

  /**
   * Returns all active subscriptions from our customers.
   * This should not be public facing.
   */
  async findAllSubscriptions(): Promise<Stripe.Subscription[]> {
    const subscriptions = await this.stripe.subscriptions.list();

    return subscriptions.data;
  }

  async findOneSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

    return subscription;
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

  async findOneCustomer(stripeCustomerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    const customer = await this.stripe.customers.retrieve(stripeCustomerId, {
      expand: ['subscriptions', 'subscriptions.data.plan.product', 'subscriptions.data.latest_invoice']
    });

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

  async findOneCustomerSubscriptionStatus(stripeCustomerId: string): Promise<Stripe.Subscription.Status> {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId
    });

    if (!subscriptions.data.length) {
      return subscriptions.data[0].status
    }

    // If there is no active subscription, it's either "canceled", or the customer was not a subscriber before

    // TODO: handle scenario where customer was not a subscriber before
    return 'canceled'
  }

  /**
   * Method to buy a new subscription plan when the user has no subscription yet.
   * @param stripeCustomerId
   * @param stripePlanId 
   */
  async buyNewSubscriptionPlan(stripeCustomerId: string, stripePlanId: string, stripePaymentMethodId: string): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          plan: stripePlanId,
        }
      ], 
      expand: ['latest_invoice.payment_intent'],
      default_payment_method: stripePaymentMethodId,
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
    const paymentMethod = await stripe.paymentMethods.attach(stripePaymentMethodId, {
      customer: stripeCustomerId,
    });

    return paymentMethod
  }
}
