import { getConnection } from 'typeorm';

import { Customer } from '../database/entities/customer';
import { Organization } from '../database/entities/organization';
import { Publication } from '../database/entities/publication';
import { User } from '../database/entities/user';
import { CollectionResponse } from '../typings';
import { BaseService } from './index';

export class OrganizationService extends BaseService {
  constructor () {
    super()
  }

  async findAll(userId: string, page: number, perPage: number): Promise<CollectionResponse<Organization[]>> {
    const skip = (page * perPage) - perPage;
    const take = perPage;

    const [organizations, total] = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .innerJoin('organization.users', 'user', 'user.id = :userId', { userId })
      .select()
      .skip(skip)
      .take(take)
      .getManyAndCount()

    const totalPages = Math.ceil(total / perPage);

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

  async findPublications(organizationId: string): Promise<Publication[]> {
    const organization = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .leftJoinAndSelect("organization.publications", "publication")
      .where('organization.id = :organizationId', { organizationId })
      .getOne()

    if (!organization) {
      throw {
        status: 404,
        message: 'Organization does not exist.'
      }
    }

    if (!organization.publications || !organization.publications.length) {
      throw {
        status: 404,
        message: 'Organization does not have any publications yet.'
      }
    }

    return organization.publications;
  }

  async findUsers(organizationId: string): Promise<User[]> {
    const organization = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .leftJoinAndSelect("organization.users", "user")
      .where('organization.id = :organizationId', { organizationId })
      .getOne()

    if (!organization) {
      throw {
        status: 404,
        message: 'Organization does not exist.'
      }
    }

    if (!organization.users || !organization.users.length) {
      throw {
        status: 404,
        message: 'Organization does not have any users yet.'
      }
    }

    return organization.users;
  }

  async findCustomer(organizationId: string): Promise<Customer> {
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

  async findAdmin(organizationId: string): Promise<User> {
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

  async changeAdmin(organizationId: string, authenticatedUserId: string, newAdminUserId: string): Promise<Organization> {
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
    organization.admin = newAdmin

    return getConnection().manager.save(organization)
  }
}
