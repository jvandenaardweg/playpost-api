import Stripe from 'stripe';
import { getConnection, getRepository, Repository } from 'typeorm';

import { stripe } from '../billing';
import { Organization } from '../database/entities/organization';
import { Publication } from '../database/entities/publication';
import { User } from '../database/entities/user';
import { HttpError, HttpStatus } from '../http-error';
import * as AWSSes from '../mailers/aws-ses';
import { CollectionResponse } from '../typings';
import { BaseService } from './index';
import { logger } from '../utils';
// tslint:disable-next-line: no-submodule-imports
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BillingService } from './billing-service';

export class OrganizationService extends BaseService {
  private readonly organizationRepository: Repository<Organization>;
  private readonly publicationRepository: Repository<Publication>;
  private readonly userRepository: Repository<User>;
  private readonly billingService: BillingService;

  constructor () {
    super()

    this.organizationRepository = getRepository(Organization);
    this.publicationRepository = getRepository(Publication);
    this.userRepository = getRepository(User);
    this.billingService = new BillingService();
  }

  /**
   * Find all organization's the user has access to.
   *
   * @param userId
   * @param page 
   * @param perPage 
   * @param skip 
   * @param take 
   */
  async findAllByUserId(userId: string): Promise<Organization[]> {
    const organizations = await this.organizationRepository
      .createQueryBuilder('organization')
      .innerJoin('organization.users', 'user', 'user.id = :userId', { userId })
      .select()
      .getMany()

    return organizations
  }

  /**
   * Fast query to verify the existens of an organization.
   *
   * @param organizationId
   */
  async findOneExists(organizationId: string): Promise<boolean> {
    const organization = await this.organizationRepository
      .createQueryBuilder('organization')
      .where('organization.id = :organizationId', { organizationId })
      .select('id')
      .getOne()

    return !!organization;
  }

  /**
   * Find on organization by organization id.
   *
   * @param organizationId
   */
  async findOneById(organizationId: string): Promise<Organization | undefined> {
    const organization = await this.organizationRepository
      .createQueryBuilder('organization')
      .leftJoinAndSelect("organization.publications", "publication")
      .leftJoinAndSelect("organization.users", "users")
      .leftJoinAndSelect("organization.admin", "admin")
      .where('organization.id = :organizationId', { organizationId })
      .getOne()

    return organization;
  }

  /**
   * Find all publications of the organization.
   *
   * @param organizationId
   * @param page 
   * @param perPage 
   * @param skip 
   * @param take
   */
  async findAllPublications(organizationId: string, page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<Publication[]>> {
    const [publications, total] = await this.publicationRepository
      .createQueryBuilder('publication')
      .leftJoin("publication.organization", "organization")
      .where('organization.id = :organizationId', { organizationId })
      .skip(skip)
      .take(take)
      .getManyAndCount()

    const totalPages = this.getTotalPages(total, perPage);

    const response: CollectionResponse<Publication[]> = {
      total,
      page,
      perPage,
      totalPages,
      data: publications
    }

    return response
  }

  /**
   * Find all users attached to this organization.
   *
   * @param organizationId
   * @param page 
   * @param perPage 
   * @param skip 
   * @param take 
   */
  async findAllUsers(organizationId: string, page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<User[]>> {
    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin("user.organizations", "organization")
      .where('organization.id = :organizationId', { organizationId })
      .skip(skip)
      .take(take)
      .getManyAndCount()

    const totalPages = this.getTotalPages(total, perPage);

    const response: CollectionResponse<User[]> = {
      total,
      page,
      perPage,
      totalPages,
      data: users
    }

    return response
  }

  /**
   * Find the admin user of this organization.
   *
   * @param organizationId
   */
  async findOneAdmin(organizationId: string): Promise<User | undefined> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      return undefined;
    }

    if (!organization.admin) {
      return undefined;
    }

    return organization.admin;
  }

  /**
   * Saves the organization in the database.
   * Will insert a new organization if the organization does not exist.
   * Will update the organization if it exists.
   *
   * @param organization
   */
  async save(organization: Organization) {
    return getConnection().manager.save(organization);
  }

  async update(organizationId: string, partialEntity: QueryDeepPartialEntity<Organization>) {
    return this.organizationRepository.update({ id: organizationId }, partialEntity)
  }

  /**
   * Save a user as the admin for the organization.
   *
   * @param organization
   * @param newAdminUserId 
   */
  async saveAdmin(organization: Organization, newAdminUserId: string): Promise<Organization | undefined> {
    const newAdmin = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: newAdminUserId })
      .getOne();

    if (!newAdmin) {
      return undefined;
    }

    // Change the admin to the new admin
    // tslint:disable-next-line: no-object-literal-type-assertion
    const oldAdmin = { ...organization.admin } as User; // Make a copy of the old admin object, so we can use that

    organization.admin = newAdmin

    const updatedOrganization = await getConnection().manager.save(organization);

    // Send confirmation emails
    await Promise.all([
      // Admin rights added
      AWSSes.sendTransactionalEmail(
        newAdmin.email,
        `You are now an admin of: ${updatedOrganization.name}`,
        `
          <p>Hi,</p>
          <p>This is an e-mail to confirm you now have admin rights on organization <strong>${updatedOrganization.name}</strong>.</p>
          <p>Use these superpowers wisely :-)</p>
          <p><a href="${process.env.PUBLISHERS_BASE_URL}">View organization</a></p>
        `
      ),
      // Admin rights removed
      AWSSes.sendTransactionalEmail(
        oldAdmin.email,
        `Removed your admin rights on: ${updatedOrganization.name}`,
        `
          <p>Hi,</p>
          <p>This is an e-mail to confirm your admin rights on organization <strong>${updatedOrganization.name}</strong> have been removed and replaced to user: ${newAdmin.email}.</p>
          <p><a href="${process.env.PUBLISHERS_BASE_URL}">Login</a></p>
        `
      )
    ]);

    return updatedOrganization
  }

  /**
   * Updates the customer in Stripe.
   *
   * @param organizationId
   * @param authenticatedUserId
   * @param customerUpdateFields 
   */
  async updateOneCustomer(organizationId: string, customerUpdateFields: Stripe.CustomerUpdateParams, taxIdValue?: string): Promise<Stripe.Customer> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    const updateOneCustomerFields: Stripe.CustomerUpdateParams = {
      email: customerUpdateFields.email,
      name: customerUpdateFields.name,
      address: customerUpdateFields.address,
      phone: customerUpdateFields.phone,
      metadata: {
        customerId: organization.stripeCustomerId,
        organizationId: organization.id,
        adminEmail: organization.admin ? organization.admin.email : ''
      },
    }

    // Update the organization name in our database
    await this.update(organizationId, {
      name: organization.name
    })

    // Get the customer's current tax id's
    const currentTaxIds = await this.billingService.listCustomerTaxIds(organization.stripeCustomerId)
    
    // Get the correct Stripe TaxId type based on the user's Country Code
    const countryCode = customerUpdateFields.address?.country?.toUpperCase();
    const taxIdForCountry = countryCode ? this.billingService.taxIdTypes[countryCode] : undefined;
    const taxIdType = taxIdForCountry && taxIdForCountry[0] ? taxIdForCountry[0].type : undefined;
    const normalizedTaxIdValue = taxIdValue ? taxIdValue.toUpperCase().replace(/\s/g, '').trim() : taxIdValue;

    // Check for tax id existence
    // Use combined "value" and "type". As a user might change his type and value
    const taxIdExists = currentTaxIds.some(taxId => taxId.value === normalizedTaxIdValue && taxId.type === taxIdType);
    
    // If the customer has tax id's
    // But the new tax ID does not exist
    // Delete the tax id's, so we can add a new one
    if (currentTaxIds.length && !taxIdExists) {
      for (const taxId of currentTaxIds) {
        logger.info(`Deleting current tax ID: "${taxId.id}" for customer ID: "${organization.stripeCustomerId}"`);
        await this.billingService.deleteCustomerTaxId(organization.stripeCustomerId, taxId.id)
      }
    }

    // Only create a new tax ID when it does not exist and the user has send a "value" and "type"
    if (!taxIdExists && normalizedTaxIdValue && taxIdType) {
      logger.info(`Creating new Tax ID for customer ID: "${organization.stripeCustomerId}"`, taxIdType, normalizedTaxIdValue);
      await this.billingService.createCustomerTaxId(organization.stripeCustomerId, {
        type: taxIdType,
        value: normalizedTaxIdValue
      })
    }

    const updatedStripeCustomer = await this.billingService.updateCustomer(organization.stripeCustomerId, updateOneCustomerFields);

    return updatedStripeCustomer;
  }

  /**
   * Find all the subscriptions of the organization customer.
   *
   * @param organizationId
   */
  async findAllCustomerSubscriptions(organizationId: string): Promise<Stripe.Subscription[]> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: organization.stripeCustomerId,
      // Also get the complete product, customer and latest invoice object's
      // So we do not need to do seperate calls to Stripe to get these required details we want to present to our users
      expand: ['data.plan.product', 'data.customer', 'data.latest_invoice'],
      status: 'all'
    });

    return subscriptions.data;
  }

  /**
   * Find one customer subscription from Stripe using the `stripeSubscriptionId`.
   *
   * @param stripeSubscriptionId
   */
  async findOneCustomerSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription> {
    const subscriptions = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    return subscriptions;
  }

  /**
   * Find all customer subscription items from Stripe using `stripeSubscriptionId`.
   *
   * @param stripeSubscriptionId
   */
  async findAllCustomerSubscriptionItems(stripeSubscriptionId: string): Promise<Stripe.SubscriptionItem[]> {
    const subscriptionItems = await stripe.subscriptionItems.list({
      subscription: stripeSubscriptionId
    })

    return subscriptionItems.data;
  }

  /**
   * Find all customer subscription items usage record summaries from Stripe using `stripeSubscriptionItemId`.
   *
   * @param stripeSubscriptionItemId
   */
  async findAllCustomerSubscriptionItemsUsageRecordsSummaries(stripeSubscriptionItemId: string): Promise<Stripe.UsageRecordSummary[]> {
    const usageRecordSummaries = await stripe.subscriptionItems.listUsageRecordSummaries(stripeSubscriptionItemId)

    return usageRecordSummaries.data;
  }

  /**
   * Find all customer invoices of the organization.
   *
   * @param organizationId
   */
  async findAllCustomerInvoices(organizationId: string): Promise<Stripe.ApiList<Stripe.Invoice>> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    const invoices = await stripe.invoices.list({
      customer: organization.stripeCustomerId
    })

    return invoices;
  }

  /**
   * Find all upcoming invoices for the customer.
   *
   * @param organizationId
   */
  async findOneCustomerInvoiceUpcoming(organizationId: string): Promise<Stripe.Invoice> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    const invoicesUpcoming = await stripe.invoices.retrieveUpcoming({
      customer: organization.stripeCustomerId
    })

    return invoicesUpcoming;
  }

  /**
   * Cancels a customer's subscription immediately. The customer will not be charged again for the subscription.
   *
   * Pending invoices will be charged at the end of the period.
   *
   * @param stripeSubscriptionId
   */
  async cancelSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription> {
    const subscriptions = await stripe.subscriptions.del(stripeSubscriptionId)

    return subscriptions;
  }
}
