import Stripe from 'stripe';
import { getConnection, getRepository, Repository } from 'typeorm';

import { stripe } from '../billing';
import { Customer } from '../database/entities/customer';
import { Organization } from '../database/entities/organization';
import { Publication } from '../database/entities/publication';
import { User } from '../database/entities/user';
import { HttpError, HttpStatus } from '../http-error';
import * as AWSSes from '../mailers/aws-ses';
import { CollectionResponse } from '../typings';
import { BaseService } from './index';

export class OrganizationService extends BaseService {
  private readonly organizationRepository: Repository<Organization>;
  private readonly publicationRepository: Repository<Publication>;
  private readonly userRepository: Repository<User>;

  constructor () {
    super()

    this.organizationRepository = getRepository(Organization);
    this.publicationRepository = getRepository(Publication);
    this.userRepository = getRepository(User);
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
  async findAll(userId: string, page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<Organization[]>> {
    const [organizations, total] = await this.organizationRepository
      .createQueryBuilder('organization')
      .innerJoin('organization.users', 'user', 'user.id = :userId', { userId })
      .select()
      .skip(skip)
      .take(take)
      .getManyAndCount()

    const totalPages = this.getTotalPages(total, perPage);

    const response: CollectionResponse<Organization[]> = {
      total,
      page,
      perPage,
      totalPages,
      data: organizations
    }

    return response
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
      .leftJoinAndSelect("organization.customer", "customer")
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
   * Find the customer object of the organization.
   *
   * @param organizationId
   */
  async findOneCustomer(organizationId: string): Promise<Customer | undefined> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      return undefined;
    }

    if (!organization.customer) {
      return undefined;
    }

    return organization.customer;
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
  async updateCustomer(organizationId: string, customerUpdateFields: Stripe.CustomerUpdateParams): Promise<Stripe.Customer> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    if (!organization.customer) {
      throw new HttpError(HttpStatus.BadRequest, 'This organization is not a customer yet.');
    }

    const updateCustomerFields: Stripe.CustomerUpdateParams = {
      email: customerUpdateFields.email,
      name: customerUpdateFields.name,
      address: customerUpdateFields.address,
      phone: customerUpdateFields.phone,
      metadata: {
        customerId: organization.customer.id,
        organizationId: organization.id,
        adminEmail: organization.admin ? organization.admin.email : ''
      },
    }

    // const taxIds = await stripe.customers.listTaxIds(organization.customer.stripeCustomerId);

    // // User has no tax ID, add it.
    // if (customerUpdateFields && !taxIds.data.length) {
    //   await stripe.customers.createTaxId(organization.customer.stripeCustomerId, {
    //     type: 'eu_vat', // TODO: fill in
    //     value: 'VATNUMBER0123' // TODO: fill in
    //   })
    // } else {
    //   // A user can only have one tax ID
    //   // const currentTaxId = taxIds;

    //   // Update tax ID
    //   // await stripe.customers.deleteTaxId(, taxIds.data[0].v)
    // }

    const updatedStripeCustomer = await stripe.customers.update(organization.customer.stripeCustomerId, updateCustomerFields);

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

    if (!organization.customer) {
      throw new HttpError(HttpStatus.BadRequest, 'This organization is not a customer yet.');
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: organization.customer.stripeCustomerId,
      // Also get the complete product, customer and latest invoice object's
      // So we do not need to do seperate calls to Stripe to get these required details we want to present to our users
      expand: ['data.plan.product', 'data.customer', 'data.latest_invoice']
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

    if (!organization.customer) {
      throw new HttpError(HttpStatus.BadRequest, 'This organization is not a customer yet.');
    }

    const invoices = await stripe.invoices.list({
      customer: organization.customer.stripeCustomerId
    })

    return invoices;
  }

  /**
   * Find all upcoming invoices for the customer.
   *
   * @param organizationId
   */
  async findAllCustomerInvoicesUpcoming(organizationId: string): Promise<Stripe.Invoice> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    if (!organization.customer) {
      throw new HttpError(HttpStatus.BadRequest, 'This organization is not a customer yet.');
    }

    const invoicesUpcoming = await stripe.invoices.retrieveUpcoming({
      customer: organization.customer.stripeCustomerId
    })

    return invoicesUpcoming;
  }
}
