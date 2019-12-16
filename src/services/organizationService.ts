import { getConnection } from 'typeorm';

import { Customer } from '../database/entities/customer';
import { Organization } from '../database/entities/organization';
import { Publication } from '../database/entities/publication';
import { User } from '../database/entities/user';
import * as AWSSes from '../mailers/aws-ses';
import { CollectionResponse } from '../typings';
import { BaseService } from './index';
import { stripe } from '../billing';
import Stripe = require('stripe');

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

  async findOne(organizationId: string): Promise<Organization> {
    const organization = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .leftJoinAndSelect("organization.customer", "customer")
      .leftJoinAndSelect("organization.publications", "publication")
      .leftJoinAndSelect("organization.users", "users")
      .leftJoinAndSelect("organization.admin", "admin")
      .where('organization.id = :organizationId', { organizationId })
      .getOne()

    if (!organization) {
      throw {
        status: 404,
        message: 'Organization does not exist.'
      }
    }

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

  async findOneCustomer(organizationId: string): Promise<Customer> {
    const organization = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .leftJoinAndSelect("organization.customer", "customer")
      .where('organization.id = :organizationId', { organizationId })
      .getOne()

    if (!organization) {
      throw {
        status: 404,
        message: 'Organization does not exist.'
      }
    }

    if (!organization.customer) {
      throw {
        status: 404,
        message: 'Organization is not a customer yet.'
      }
    }

    return organization.customer;
  }

  async findOneAdmin(organizationId: string): Promise<User> {
    const organization = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .leftJoinAndSelect("organization.admin", "admin")
      .where('organization.id = :organizationId', { organizationId })
      .getOne()

    if (!organization) {
      throw {
        status: 404,
        message: 'Organization does not exist.'
      }
    }

    if (!organization.admin) {
      throw {
        status: 404,
        message: 'Organization does not have an admin.'
      }
    }

    return organization.admin;
  }

  async saveAdmin(organizationId: string, authenticatedUserId: string, newAdminUserId: string): Promise<Organization> {
    if (authenticatedUserId === newAdminUserId) {
      throw {
        status: 403,
        message: 'This user is already an admin of this organization.'
      }
    }

    const organization = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .leftJoinAndSelect("organization.admin", "admin")
      .where('organization.id = :organizationId', { organizationId })
      .getOne()

    if (!organization) {
      throw {
        status: 404,
        message: 'Organization does not exist.'
      }
    }

    if (organization.admin.id !== authenticatedUserId) {
      throw {
        status: 403,
        message: 'You are not allowed to do this because you are not an admin of this organization.'
      }
    }

    const newAdmin = await getConnection()
      .getRepository(User)
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: newAdminUserId })
      .getOne();

    if (!newAdmin) {
      throw {
        status: 404,
        message: 'User to be added as a new admin does not exist.'
      }
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
  async updateCustomer(organizationId: string, authenticatedUserId: string, customerUpdateFields: Stripe.customers.ICustomerUpdateOptions): Promise<Stripe.customers.ICustomer> {
    const organization = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .leftJoinAndSelect("organization.admin", "admin")
      .leftJoinAndSelect("organization.customer", "customer")
      .where('organization.id = :organizationId', { organizationId })
      .getOne()

    if (!organization) {
      throw {
        status: 404,
        message: 'Organization does not exist.'
      }
    }

    if (organization.admin.id !== authenticatedUserId) {
      throw {
        status: 403,
        message: 'You are not allowed to do this because you are not an admin of this organization.'
      }
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
      }
    }

    const updatedStripeCustomer = await stripe.customers.update(organization.customer.stripeCustomerId, updateCustomerFields);

    return updatedStripeCustomer;
  }
}
