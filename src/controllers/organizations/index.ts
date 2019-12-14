
import { NextFunction, Request, Response } from 'express';
import { getConnection, getRepository, Repository } from 'typeorm';
import { stripe } from '../../billing';
import { Customer } from '../../database/entities/customer';
import { Organization } from '../../database/entities/organization';
import { Publication } from '../../database/entities/publication';
import { User } from '../../database/entities/user';
import { CollectionRequestQuery, CollectionResponse } from '../../typings';
import joi from 'joi';

export class OrganizationsController {
  organizationRepository: Repository<Organization>;
  publicationRepository: Repository<Publication>;
  userRepository: Repository<User>;
  customerRepository: Repository<Customer>;

  constructor() {
    this.organizationRepository = getRepository(Organization);
    this.publicationRepository = getRepository(Publication);
    this.userRepository = getRepository(User);
    this.customerRepository = getRepository(Customer);
  }

  restrictResourceToOwner = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    const { organizationId } = req.params;
    const userId = req.user.id;

    const organization = await this.organizationRepository.findOne(organizationId, {
      select: ['id', 'admin'],
      relations: ['users', 'admin']
    });

    if (!organization) {
      return res.status(404).json({
        message: 'The organization could not be found.'
      });
    }

    const isAllowed = organization.users.some(user => user.id === userId);

    if (!isAllowed) {
      return res.status(403).json({
        message: 'You have no access to this organization.'
      })
    }

    return next()
  }

  /**
   * Finds all organizations belonging to the authenticated user.
   *
   * @returns Promise<Response>
   */
  getAll = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user.id;
    const { page, perPage } = req.query as CollectionRequestQuery;

    const validationSchemaRequestQuery = joi.object().keys({
      page: joi.number().integer(),
      perPage: joi.number().integer()
    })

    const { error } = joi.validate(req.query, validationSchemaRequestQuery);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
        details: error.details[0]
      })
    }

    const pageParam = parseInt(page, 10) || 1;
    const perPageParam = parseInt(perPage, 10) || 10;
    const skip = (pageParam * perPageParam) - perPageParam;
    const take = perPageParam;

    const [organizations, total] = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .innerJoin('organization.users', 'user', 'user.id = :userId', { userId })
      .select()
      .skip(skip)
      .take(take)
      .getManyAndCount()

    const response: CollectionResponse<Organization[]> = {
      total,
      page: pageParam,
      perPage: perPageParam,
      data: organizations
    }

    return res.json(response)
  }

  /**
   * Get one organization belonging to the authenticated user.
   *
   * @returns Promise<Response>
   */
  getOne = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    const organization = await this.organizationRepository.findOne(organizationId, {
      relations: ['customer', 'publications', 'users']
    });

    return res.json(organization)
  }

  /**
   * Creates a publication for the selected organization.
   */
  createPublication = async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { name, url } = req.body;
    const userId = req.user.id;

    // When we end up here, the user is allowed to create a publiction for this organization

    const organization = await this.organizationRepository.findOne(organizationId, {
      select: ['id', 'name', 'admin']
    })

    if (!organization) {
      return res.status(404).json({
        message: 'Organization could not be found.'
      })
    }

    // if (!organization || (organization.admin && organization.admin.id !== userId)) {
    //   return res.status(403).json({
    //     message: `You cannot create a new publication because you are not an admin of this organization.`
    //   })
    // }

    const user = await this.userRepository.findOne(userId);

    if (!user) {
      return res.status(400).json({
        message: `We could not find your account.`
      })
    }

    const newPublication = new Publication();

    newPublication.name = name;
    newPublication.url = url;
    newPublication.users = [user]; // Connect the admin to this publication so he has access to it
    newPublication.organization = organization; // Connect the organization of the user to the publication

    // Create the publication and attach it to the organization and user (admin)
    const createdPublication = await this.publicationRepository.save(newPublication)

    return res.json(createdPublication)
  }

  /**
   * Associates a existing user to an organization
   */
  createUser = async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { email } = req.body;

    const normalizedEmail = User.normalizeEmail(email);

    const newUser = await this.userRepository.findOne({
      where: {
        email: normalizedEmail
      }
    });

    if (!newUser) {
      // TODO: invite user
      return res.status(404).json({
        message: 'A user with that email address does not exist.'
      })
    }

    const organization = await this.organizationRepository.findOne(organizationId, {
      relations: ['users'] // Important: we need the current users to push the new user into that array
    });

    if (!organization) {
      return res.status(404).json({
        message: 'The organization does not exist.'
      })
    }

    const userExistsInOrganization = organization.users.some(organizationUser => organizationUser.id === newUser.id);

    if (userExistsInOrganization) {
      return res.status(409).json({
        message: 'The user already exists in this organization.'
      })
    }

    // Attach existing users and new user to the organization
    organization.users.push(newUser)

    const updatedOrganization = await this.organizationRepository.save(organization);

    return res.json(updatedOrganization)
  }

  deleteUser = async (req: Request, res: Response) => {
    const { organizationId, userId } = req.params;

    const organization = await this.organizationRepository.findOne(organizationId, {
      relations: ['users'] // Important: we need the current users to update the array
    });

    if (!organization) {
      return res.status(404).json({
        message: 'The organization does not exist.'
      })
    }

    const userExistsInOrganization = organization.users.some(organizationUser => organizationUser.id === userId);

    if (!userExistsInOrganization) {
      return res.status(409).json({
        message: 'The user does not exist in this organization.'
      })
    }

    // Filter out the user we want to delete
    const usersWithoutUserToDelete = organization.users.filter(organizationUser => organizationUser.id !== userId)

    // Set the new users, without the deleted user
    organization.users = usersWithoutUserToDelete;

    const updatedOrganization = await this.organizationRepository.save(organization);

    return res.json(updatedOrganization)
  }

  /**
   * Deletes a publication from the database.
   * IMPORTANT: Very destructive operation.
   */
  deletePublication = async (req: Request, res: Response) => {
    const { organizationId, publicationId } = req.params;

    const organization = await this.organizationRepository.findOne(organizationId, {
      relations: ['publications']
    });

    if (!organization) {
      return res.status(404).json({
        message: 'The organization does not exist.'
      })
    }

    const publication = await this.publicationRepository.findOne(publicationId);

    if (!publication) {
      return res.status(404).json({
        message: 'Publication does not exist.'
      })
    }

    // TODO: delete publication articles
    // TODO: delete publication audiofiles

    await this.publicationRepository.remove(publication);

    return res.status(200).send();
  }

  getCustomer = async (req: Request, res: Response) => {
    const { organizationId } = req.params;

    const organization = await this.organizationRepository.findOne(organizationId, {
      relations: ['customer']
    });

    if (!organization) {
      return res.status(404).json({
        message: 'The organization does not exist.'
      })
    }

    const { stripeCustomerId } = organization.customer;

    if (!stripeCustomerId) {
      return res.status(204).send()
    }

    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);

    return res.json({
      ...organization.customer,
      stripeCustomer
    });
  }
}
