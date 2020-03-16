import { BillingService } from '../billing-service';
import { productsWithPlansMock } from '../../../tests/__mocks/billing/products-with-plans';
import { productMock } from '../../../tests/__mocks/billing/product';
import { plansMock } from '../../../tests/__mocks/billing/plans';
import { taxRatesMock } from '../../../tests/__mocks/billing/tax-rates';
import { customerMock } from '../../../tests/__mocks/billing/customer';
import { subscriptionsMock } from '../../../tests/__mocks/billing/subscriptions';
import { subscriptionMock } from '../../../tests/__mocks/billing/subscription';
import { paymentMethodsMock } from '../../../tests/__mocks/billing/payment-methods';
import { paymentMethodMock } from '../../../tests/__mocks/billing/payment-method';
import { setupIntentMock } from '../../../tests/__mocks/billing/setup-intent';
import { taxIdMock } from '../../../tests/__mocks/billing/tax-id';
import { taxIdsMock } from '../../../tests/__mocks/billing/tax-ids';
import { deletedTaxIdMock } from '../../../tests/__mocks/billing/deleted-tax-id';
import { salesTaxMock } from '../../../tests/__mocks/billing/sales-tax';
import { stripe } from '../../billing';
import SalesTax from 'sales-tax';

describe('billing-service', () => {

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it('findAllProducts should return an array of Stripe Products.', async () => {
    const billingService = new BillingService();
    const spyStripeProductsList = jest.spyOn(stripe.products, 'list').mockResolvedValue({ data: productsWithPlansMock } as any)

    const products = await billingService.findAllProducts()
    
    expect(spyStripeProductsList).toHaveBeenCalledTimes(1);
    expect(products).toMatchObject(productsWithPlansMock);
  })

  it('findOneProduct should return a Stripe Product object.', async () => {
    const billingService = new BillingService();
    const spyStripeProductsRetrieve = jest.spyOn(stripe.products, 'retrieve').mockResolvedValue(productMock as any)

    const product = await billingService.findOneProduct('prod_GjA0qRb0NtdZQH')
    
    expect(spyStripeProductsRetrieve).toHaveBeenCalledTimes(1);
    expect(spyStripeProductsRetrieve).toHaveBeenCalledWith('prod_GjA0qRb0NtdZQH');

    expect(product).toMatchObject(productMock);
  })

  it('findAllPlans should return an array of Stripe Plans.', async () => {
    const billingService = new BillingService();
    const spyStripePlansList = jest.spyOn(stripe.plans, 'list').mockResolvedValue({ data: plansMock } as any)

    const plans = await billingService.findAllPlans()
    
    expect(spyStripePlansList).toHaveBeenCalledTimes(1);

    expect(plans).toMatchObject(plansMock);
  })

  it('findOnePlan should return a Stripe Plan object.', async () => {
    const billingService = new BillingService();
    const spyStripePlansRetrieve = jest.spyOn(stripe.plans, 'retrieve').mockResolvedValue(plansMock as any)

    const plan = await billingService.findOnePlan('plan_GjA6MM7vp1T0Tn')
    
    expect(spyStripePlansRetrieve).toHaveBeenCalledTimes(1);
    expect(spyStripePlansRetrieve).toHaveBeenCalledWith('plan_GjA6MM7vp1T0Tn');

    expect(plan).toMatchObject(plansMock);
  })

  it('findAllTaxRates should return an array of Tax Rates.', async () => {
    const billingService = new BillingService();
    const spyStripeTaxRatesList = jest.spyOn(stripe.taxRates, 'list').mockResolvedValue({ data: taxRatesMock } as any)

    const taxRates = await billingService.findAllTaxRates()
    
    expect(spyStripeTaxRatesList).toHaveBeenCalledTimes(1);

    expect(taxRates).toMatchObject(taxRatesMock);
  })

  it('findOneTaxRate should return a Stripe TaxRate object.', async () => {
    const billingService = new BillingService();
    const spyStripeTaxRatesRetrieve = jest.spyOn(stripe.taxRates, 'retrieve').mockResolvedValue(taxRatesMock as any)

    const taxRates = await billingService.findOneTaxRate('txr_1Fqzv1LbygOvfi9oYJqZckKS')
    
    expect(spyStripeTaxRatesRetrieve).toHaveBeenCalledTimes(1);
    expect(spyStripeTaxRatesRetrieve).toHaveBeenCalledWith('txr_1Fqzv1LbygOvfi9oYJqZckKS');

    expect(taxRates).toMatchObject(taxRatesMock);
  })

  it('findOneCustomer should return a Stripe Customer object.', async () => {
    const billingService = new BillingService();
    const spyStripeCustomersRetrieve = jest.spyOn(stripe.customers, 'retrieve').mockResolvedValue(customerMock as any)

    const customer = await billingService.findOneCustomer('cus_GLBNvU7Y4CEL02')
    
    expect(spyStripeCustomersRetrieve).toHaveBeenCalledTimes(1);
    expect(spyStripeCustomersRetrieve).toHaveBeenCalledWith('cus_GLBNvU7Y4CEL02');

    expect(customer).toMatchObject(customerMock);
  })

  it('findOneCustomerSubscriptions should return a Stripe Subscriptions array for the given customer.', async () => {
    const billingService = new BillingService();
    const spyStripeSubscriptionsList = jest.spyOn(stripe.subscriptions, 'list').mockResolvedValue({
      data: subscriptionsMock
    } as any)

    const customerSubscriptions = await billingService.findOneCustomerSubscriptions('cus_GLBNvU7Y4CEL02')
    
    expect(spyStripeSubscriptionsList).toHaveBeenCalledTimes(1);
    expect(spyStripeSubscriptionsList).toHaveBeenCalledWith({
      customer: 'cus_GLBNvU7Y4CEL02'
    });

    expect(customerSubscriptions).toMatchObject(subscriptionsMock);
  })

  it('findAllCustomerPaymentMethods should return a Stripe PaymentMethods array for the given customer.', async () => {
    const billingService = new BillingService();
    const spyStripePaymentMethodsList = jest.spyOn(stripe.paymentMethods, 'list').mockResolvedValue({
      data: paymentMethodsMock
    } as any)

    const customerPaymentMethods = await billingService.findAllCustomerPaymentMethods('cus_GLBNvU7Y4CEL02')
    
    expect(spyStripePaymentMethodsList).toHaveBeenCalledTimes(1);
    expect(spyStripePaymentMethodsList).toHaveBeenCalledWith({
      customer: 'cus_GLBNvU7Y4CEL02',
      type: 'card'
    });

    expect(customerPaymentMethods).toMatchObject(paymentMethodsMock);
  })

  it('deleteOneCustomerPaymentMethod should detatch (delete) a Stripe PaymentMethod.', async () => {
    const billingService = new BillingService();
    const spyStripePaymentMethodsDetch = jest.spyOn(stripe.paymentMethods, 'detach').mockResolvedValue(paymentMethodsMock as any)

    const deletedCustomerPaymentMethod = await billingService.deleteOneCustomerPaymentMethod('pm_1GCRSVLbygOvfi9ojuY8DFOq')
    
    expect(spyStripePaymentMethodsDetch).toHaveBeenCalledTimes(1);
    expect(spyStripePaymentMethodsDetch).toHaveBeenCalledWith('pm_1GCRSVLbygOvfi9ojuY8DFOq');

    expect(deletedCustomerPaymentMethod).toMatchObject(paymentMethodsMock);
  })
  
  it('createOneCustomerSetupIntent should create a Stripe Setup Intent.', async () => {
    const billingService = new BillingService();
    const spyStripeSetupIntentsCreate = jest.spyOn(stripe.setupIntents, 'create').mockResolvedValue(setupIntentMock as any)

    const customerSetupIntent = await billingService.createOneCustomerSetupIntent('cus_GLBNvU7Y4CEL02')
    
    expect(spyStripeSetupIntentsCreate).toHaveBeenCalledTimes(1);
    expect(spyStripeSetupIntentsCreate).toHaveBeenCalledWith({
      customer: 'cus_GLBNvU7Y4CEL02',
      usage: 'off_session'
    });

    expect(customerSetupIntent).toMatchObject(setupIntentMock);
  })

  it('findOnePaymentMethod should return a Stripe PaymentMethod.', async () => {
    const billingService = new BillingService();
    const spyStripePaymentMethodsRetrieve = jest.spyOn(stripe.paymentMethods, 'retrieve').mockResolvedValue(paymentMethodMock as any)

    const paymentMethod = await billingService.findOnePaymentMethod('pm_1GCRSVLbygOvfi9ojuY8DFOq')
    
    expect(spyStripePaymentMethodsRetrieve).toHaveBeenCalledTimes(1);
    expect(spyStripePaymentMethodsRetrieve).toHaveBeenCalledWith('pm_1GCRSVLbygOvfi9ojuY8DFOq');

    expect(paymentMethod).toMatchObject(paymentMethodMock);
  })

  it('updateOneCustomerPaymentMethod should update a Stripe PaymentMethod.', async () => {
    const billingService = new BillingService();
    const spyStripePaymentMethodsUpdate = jest.spyOn(stripe.paymentMethods, 'update').mockResolvedValue(paymentMethodMock as any)

    const paymentMethod = await billingService.updateOneCustomerPaymentMethod('pm_1GCRSVLbygOvfi9ojuY8DFOq', 'J van den Aardweg', 2, 2030)
    
    expect(spyStripePaymentMethodsUpdate).toHaveBeenCalledTimes(1);
    expect(spyStripePaymentMethodsUpdate).toHaveBeenCalledWith('pm_1GCRSVLbygOvfi9ojuY8DFOq', {
      billing_details: {
        name: 'J van den Aardweg'
      },
      card: {
        exp_month: 2,
        exp_year: 2030
      }
    });

    expect(paymentMethod).toMatchObject(paymentMethodMock);
  })

  it('findOneCustomerSubscriptionStatus should return a Stripe Subscription status value for a Stripe Customer.', async () => {
    const billingService = new BillingService();
    const spyStripeSubscriptionsList = jest.spyOn(stripe.subscriptions, 'list').mockResolvedValue({
      data: subscriptionsMock
     } as any)

    const customerSubscriptionStatus = await billingService.findOneCustomerSubscriptionStatus('cus_GLBNvU7Y4CEL02')
    
    expect(spyStripeSubscriptionsList).toHaveBeenCalledTimes(1);
    expect(spyStripeSubscriptionsList).toHaveBeenCalledWith({
      customer: 'cus_GLBNvU7Y4CEL02'
    });

    expect(customerSubscriptionStatus).toBe('active');

    // Test when there are no subscriptions
    jest.spyOn(stripe.subscriptions, 'list').mockResolvedValue({
      data: []
     } as any)

     const customerSubscriptionStatus2 = await billingService.findOneCustomerSubscriptionStatus('cus_GLBNvU7Y4CEL02')

     expect(customerSubscriptionStatus2).toBe(null);
  })

  it('buyNewSubscriptionPlan should create a new Stripe Subscription for the Customer.', async () => {
    const billingService = new BillingService();
    const spyStripeSubscriptionsCreate = jest.spyOn(stripe.subscriptions, 'create').mockResolvedValue(subscriptionMock as any)

    const createdSubscription = await billingService.buyNewSubscriptionPlan('cus_GLBNvU7Y4CEL02', 'plan_GjA6MM7vp1T0Tn')
    
    expect(spyStripeSubscriptionsCreate).toHaveBeenCalledTimes(1);
    expect(spyStripeSubscriptionsCreate).toHaveBeenCalledWith({
      customer: 'cus_GLBNvU7Y4CEL02',
      items: [
        {
          plan: 'plan_GjA6MM7vp1T0Tn',
        }
      ], 
      trial_end: undefined,
      expand: ['latest_invoice.payment_intent'],
    });

    expect(createdSubscription).toMatchObject(subscriptionMock);
  })

  it('buyNewSubscriptionPlan should create a new Stripe Subscription for the Customer when using a TaxRate ID.', async () => {
    const billingService = new BillingService();
    const spyStripeSubscriptionsCreate = jest.spyOn(stripe.subscriptions, 'create').mockResolvedValue(subscriptionMock as any)

    const createdSubscription = await billingService.buyNewSubscriptionPlan('cus_GLBNvU7Y4CEL02', 'plan_GjA6MM7vp1T0Tn', 'txr_2GL2OtLbygOvfi9ox7vpowV2')
    
    expect(spyStripeSubscriptionsCreate).toHaveBeenCalledTimes(1);
    expect(spyStripeSubscriptionsCreate).toHaveBeenCalledWith({
      customer: 'cus_GLBNvU7Y4CEL02',
      items: [
        {
          plan: 'plan_GjA6MM7vp1T0Tn',
          tax_rates: ['txr_2GL2OtLbygOvfi9ox7vpowV2']
        }
      ], 
      trial_end: undefined,
      expand: ['latest_invoice.payment_intent'],
    });

    expect(createdSubscription).toMatchObject(subscriptionMock);
  })
  
  it('attachDefaultPaymentMethodToCustomer should attach a new default Stripe Payment Method to a Stripe Customer.', async () => {
    const billingService = new BillingService();
    const spyStripePaymentMethodsAttach = jest.spyOn(stripe.paymentMethods, 'attach').mockResolvedValue(paymentMethodMock as any)
    jest.spyOn(stripe.customers, 'update').mockResolvedValue({} as any)

    const attachedPaymentMethod = await billingService.attachDefaultPaymentMethodToCustomer('pm_1GCRSVLbygOvfi9ojuY8DFOq', 'cus_GLBNvU7Y4CEL02')
    
    expect(spyStripePaymentMethodsAttach).toHaveBeenCalledTimes(1);
    expect(spyStripePaymentMethodsAttach).toHaveBeenCalledWith('pm_1GCRSVLbygOvfi9ojuY8DFOq', {
      customer: 'cus_GLBNvU7Y4CEL02'
    });

    expect(attachedPaymentMethod).toMatchObject(paymentMethodMock);
  })

  it('createOneCustomerTaxId should attach a new default Stripe Payment Method to a Stripe Customer.', async () => {
    const billingService = new BillingService();
    const spyStripeCustomersCreateTaxId = jest.spyOn(stripe.customers, 'createTaxId').mockResolvedValue(taxIdMock as any)

    const createdTaxId = await billingService.createOneCustomerTaxId('cus_GLBNvU7Y4CEL02', 'eu_vat', 'NL001175463B65')
    
    expect(spyStripeCustomersCreateTaxId).toHaveBeenCalledTimes(1);
    expect(spyStripeCustomersCreateTaxId).toHaveBeenCalledWith('cus_GLBNvU7Y4CEL02', {
      type: 'eu_vat',
      value: 'NL001175463B65'
    });

    expect(createdTaxId).toMatchObject(taxIdMock);
  })

  it('deleteOneCustomerTaxId should delete TaxId from a Stripe Customer.', async () => {
    const billingService = new BillingService();
    const spyStripeCustomersCreateTaxId = jest.spyOn(stripe.customers, 'deleteTaxId').mockResolvedValue(deletedTaxIdMock as any)

    const deletedTaxId = await billingService.deleteOneCustomerTaxId('cus_GLBNvU7Y4CEL02', 'txi_1GCW7oLbygOvfi9oJXiEx2mv')
    
    expect(spyStripeCustomersCreateTaxId).toHaveBeenCalledTimes(1);
    expect(spyStripeCustomersCreateTaxId).toHaveBeenCalledWith('cus_GLBNvU7Y4CEL02', 'txi_1GCW7oLbygOvfi9oJXiEx2mv');

    expect(deletedTaxId).toMatchObject(deletedTaxIdMock);
  })

  it('findAllCustomerTaxIds should list all TaxId from a Stripe Customer.', async () => {
    const billingService = new BillingService();
    const spyStripeCustomersListTaxIds = jest.spyOn(stripe.customers, 'listTaxIds').mockResolvedValue({
      data: taxIdsMock
    } as any)

    const deletedTaxId = await billingService.findAllCustomerTaxIds('cus_GLBNvU7Y4CEL02')
    
    expect(spyStripeCustomersListTaxIds).toHaveBeenCalledTimes(1);
    expect(spyStripeCustomersListTaxIds).toHaveBeenCalledWith('cus_GLBNvU7Y4CEL02');

    expect(deletedTaxId).toMatchObject(taxIdsMock);
  })
  
  it('isValidTaxNumber should return true when given a valid tax number.', async () => {
    const billingService = new BillingService();
    const spySalesTaxValidateTaxNumber = jest.spyOn(SalesTax, 'validateTaxNumber').mockResolvedValue(true)

    const isValidTaxNumber = await billingService.isValidTaxNumber('NL', 'NL001175463B65')
    
    expect(spySalesTaxValidateTaxNumber).toHaveBeenCalledTimes(1);
    expect(spySalesTaxValidateTaxNumber).toHaveBeenCalledWith('NL', 'NL001175463B65');

    expect(isValidTaxNumber).toBe(true);
  })

  it('isValidTaxNumber should return true when given a valid tax number.', async () => {
    const billingService = new BillingService();
    const spySalesTaxGetSalesTax = jest.spyOn(SalesTax, 'getSalesTax').mockResolvedValue(salesTaxMock)

    const salesTax = await billingService.findSalesTax('NL')
    
    expect(spySalesTaxGetSalesTax).toHaveBeenCalledTimes(1);
    expect(spySalesTaxGetSalesTax).toHaveBeenCalledWith('NL');

    expect(salesTax).toMatchObject(salesTaxMock);
  })
  
  it('upgradeOrDowngradeSubscription should correctly upgrade a plan.', async () => {
    const billingService = new BillingService();
    const spyStripeSubscriptionsUpdate = jest.spyOn(stripe.subscriptions, 'update').mockResolvedValue(subscriptionMock as any)

    const updateSubscription = await billingService.upgradeOrDowngradeSubscription('sub_GjAafbGOy50oNW', 'plan_GrRr69GdC37XBb')

    expect(spyStripeSubscriptionsUpdate).toHaveBeenCalledTimes(1);
    expect(spyStripeSubscriptionsUpdate).toHaveBeenCalledWith('sub_GjAafbGOy50oNW', {
      cancel_at_period_end: false,
      items: [{
        id: 'si_GjAaZXZqKBEJA8',
        plan: 'plan_GrRr69GdC37XBb'
      }],
      expand: ['latest_invoice.payment_intent']
    });

    expect(updateSubscription).toMatchObject(subscriptionMock);
  })
  
  it('upgradeOrDowngradeSubscription should correctly upgrade a plan with a TaxRate ID.', async () => {
    const billingService = new BillingService();
    const spyStripeSubscriptionsUpdate = jest.spyOn(stripe.subscriptions, 'update').mockResolvedValue(subscriptionMock as any)

    const updateSubscription = await billingService.upgradeOrDowngradeSubscription('sub_GjAafbGOy50oNW', 'plan_GrRr69GdC37XBb', 'txi_1GCW7oLbygOvfi9oJXiEx2mv')

    expect(spyStripeSubscriptionsUpdate).toHaveBeenCalledTimes(1);
    expect(spyStripeSubscriptionsUpdate).toHaveBeenCalledWith('sub_GjAafbGOy50oNW', {
      cancel_at_period_end: false,
      items: [{
        id: 'si_GjAaZXZqKBEJA8',
        plan: 'plan_GrRr69GdC37XBb',
        tax_rates: ['txi_1GCW7oLbygOvfi9oJXiEx2mv']
      }],
      expand: ['latest_invoice.payment_intent']
    });

    expect(updateSubscription).toMatchObject(subscriptionMock);
  })

  it('upgradeOrDowngradeSubscription should correctly error when plan is the same.', async (done) => {
    const billingService = new BillingService();
    const spyStripeSubscriptionsUpdate = jest.spyOn(stripe.subscriptions, 'update').mockResolvedValue(subscriptionMock as any)

    try {
      await billingService.upgradeOrDowngradeSubscription('sub_GjAafbGOy50oNW', 'plan_GjA6MM7vp1T0Tn')
    } catch (err) {
      expect(err.message).toBe('Cannot upgrade or downgrade this subscription, because the plan is the same.')
    } finally {
      expect(spyStripeSubscriptionsUpdate).toHaveBeenCalledTimes(0);
      done()
    }
  })
})
