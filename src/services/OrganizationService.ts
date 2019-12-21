import Stripe from 'stripe';
import { getConnection } from 'typeorm';

import { stripe } from '../billing';
import { Customer } from '../database/entities/customer';
import { Organization } from '../database/entities/organization';
import { Publication } from '../database/entities/publication';
import { User } from '../database/entities/user';
import * as AWSSes from '../mailers/aws-ses';
import { CollectionResponse } from '../typings';
import { BaseService } from './index';
import { HttpError, HttpStatus } from '../http-error';

export class OrganizationService extends BaseService {
  constructor () {
    super()
  }

  async findAll(userId: string, page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<Organization[]>> {
    const [organizations, total] = await getConnection()
      .getRepository(Organization)
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

  async findOneExists(organizationId: string): Promise<boolean> {
    const organization = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .where('organization.id = :organizationId', { organizationId })
      .select('id')
      .getOne()

    return !!organization;
  }

  async findOneById(organizationId: string): Promise<Organization | undefined> {
    const organization = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .leftJoinAndSelect("organization.customer", "customer")
      .leftJoinAndSelect("organization.publications", "publication")
      .leftJoinAndSelect("organization.users", "users")
      .leftJoinAndSelect("organization.admin", "admin")
      .where('organization.id = :organizationId', { organizationId })
      .getOne()

    return organization;
  }

  async findAllPublications(organizationId: string, page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<Publication[]>> {
    const [publications, total] = await getConnection()
      .getRepository(Publication)
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

  async findAllUsers(organizationId: string, page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<User[]>> {
    const [users, total] = await getConnection()
      .getRepository(User)
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

  async save(organization: Organization) {
    return getConnection().manager.save(organization);
  }

  async saveAdmin(organization: Organization, newAdminUserId: string): Promise<Organization | undefined> {
    const newAdmin = await getConnection()
      .getRepository(User)
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
  async updateCustomer(organizationId: string, customerUpdateFields: Stripe.customers.ICustomerUpdateOptions): Promise<Stripe.customers.ICustomer> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }
    
    const updateCustomerFields: Stripe.customers.ICustomerUpdateOptions = {
      email: customerUpdateFields.email,
      name: customerUpdateFields.name,
      address: customerUpdateFields.address,
      phone: customerUpdateFields.phone,
      metadata: {
        customerId: organization.customer.id,
        organizationId: organization.id,
        adminEmail: organization.admin.email
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

  async findCustomerSubscriptions(organizationId: string): Promise<Stripe.customers.ICustomerSubscriptions> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    const subscriptions = await (await stripe.customers.retrieve(organization.customer.stripeCustomerId)).subscriptions

    return subscriptions;
  }

  async findCustomerSubscription(stripeSubscriptionId: string): Promise<Stripe.subscriptions.ISubscription> {
    const subscriptions = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    return subscriptions;
  }

  async findCustomerSubscriptionItems(stripeSubscriptionId: string): Promise<Stripe.subscriptionItems.ISubscriptionItem[]> {
    const subscriptionItems = await stripe.subscriptionItems.list({
      subscription: stripeSubscriptionId
    })

    return subscriptionItems.data;
  }

  async findCustomerSubscriptionItemsUsageRecordsSummaries(stripeSubscriptionItemId: string): Promise<Stripe.usageRecordSummaries.IUsageRecordSummariesItem[]> {
    const usageRecordSummaries = await stripe.usageRecordSummaries.list(stripeSubscriptionItemId)

    return usageRecordSummaries.data;
  }

  async findCustomerInvoices(organizationId: string): Promise<Stripe.IList<Stripe.invoices.IInvoice>> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    const invoices = await stripe.invoices.list({
      customer: organization.customer.stripeCustomerId
    })

    return invoices;
  }

  async findCustomerInvoicesUpcoming(organizationId: string): Promise<Stripe.invoices.IInvoice> {
    const organization = await this.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization does not exist.');
    }

    const invoicesUpcoming = await stripe.invoices.retrieveUpcoming({
      customer: organization.customer.stripeCustomerId
    })

    return invoicesUpcoming;
  }
}
