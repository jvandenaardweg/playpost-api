import Stripe from 'stripe';

import { stripe } from '../billing';
import { BaseService } from './index';

export class BillingService extends BaseService {
  private readonly stripe: Stripe;

  constructor () {
    super()

    this.stripe = stripe;
  }

  async findAllProducts(): Promise<Stripe.products.IProduct[]> {
    const products = await this.stripe.products.list();

    return products.data;
  }

  async findAllProductsWithPlans(): Promise<Stripe.products.IProduct[]> {
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

  async findOneProduct(stripeProductId: string): Promise<Stripe.products.IProduct> {
    const product = await this.stripe.products.retrieve(stripeProductId);

    return product;
  }

  async findAllPlans(): Promise<Stripe.plans.IPlan[]> {
    const plans = await this.stripe.plans.list()

    return plans.data;
  }

  async findOnePlan(stripePlanId: string): Promise<Stripe.plans.IPlan> {
    const plans = await this.stripe.plans.retrieve(stripePlanId)

    return plans;
  }

  /**
   * Returns all active subscriptions from our customers.
   * This should not be public facing.
   */
  async findAllSubscriptions(): Promise<Stripe.subscriptions.ISubscription[]> {
    const subscriptions = await this.stripe.subscriptions.list();

    return subscriptions.data;
  }

  async findOneSubscription(stripeSubscriptionId: string): Promise<Stripe.subscriptions.ISubscription> {
    const subscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

    return subscription;
  }

  async findAllTaxRates(): Promise<Stripe.taxRates.ITaxRate[]> {
    // The correct taxRate type does not seem to exist when we added this
    // TODO: check for new Stripe types version
    // @ts-ignore
    const taxRates = await this.stripe.taxRates.list();

    return taxRates.data;
  }

  async findOneTaxRate(stripeTaxRateId: string): Promise<Stripe.taxRates.ITaxRate> {
    // The correct taxRate type does not seem to exist when we added this
    // TODO: check for new Stripe types version
    // @ts-ignore
    const taxRate = await this.stripe.taxRates.retrieve(stripeTaxRateId);

    return taxRate;
  }

  async findOneCustomer(stripeCustomerId: string): Promise<Stripe.customers.ICustomer> {
    const customer = await this.stripe.customers.retrieve(stripeCustomerId);

    return customer;
  }

  async findOneCustomerSubscriptions(stripeCustomerId: string): Promise<Stripe.customers.ICustomerSubscriptions> {
    const customer = await this.findOneCustomer(stripeCustomerId);

    return customer.subscriptions;
  }

  async findOneCustomerSubscriptionStatus(stripeCustomerId: string): Promise<Stripe.subscriptions.SubscriptionStatus> {
    const customer = await this.findOneCustomer(stripeCustomerId);

    if (!customer.subscriptions.data.length) {
      return customer.subscriptions.data[0].status
    }

    // If there is no active subscription, it's either "canceled", or the customer was not a subscriber before

    // TODO: handle scenario where customer was not a subscriber before
    return 'canceled'
  }
}
