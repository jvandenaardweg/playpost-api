
import { NextFunction, Request, Response } from 'express';
import { getRepository, Repository } from 'typeorm';
import { stripe } from '../../billing';
import { Customer } from '../../database/entities/customer';
import { Organization } from '../../database/entities/organization';
import { Publication } from '../../database/entities/publication';
import { User } from '../../database/entities/user';
import { OrganizationService } from '../../services/organizationService';

export class OrganizationsController {
  organizationRepository: Repository<Organization>;
  publicationRepository: Repository<Publication>;
  userRepository: Repository<User>;
  customerRepository: Repository<Customer>;
  organizationService: OrganizationService;

  constructor() {
    this.organizationRepository = getRepository(Organization);
    this.publicationRepository = getRepository(Publication);
    this.userRepository = getRepository(User);
    this.customerRepository = getRepository(Customer);
    this.organizationService = new OrganizationService();
  }

  restrictResourceToOwner = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    const { organizationId } = req.params;
    const userId = req.user.id;

    try {
      const organization = await this.organizationService.findOne(organizationId);

      // Only allow access to this resource if it's a user or admin
      const isUser = organization.users.some(user => user.id === userId);
      const isAdmin = organization.admin.id === userId;

      if (!isUser && !isAdmin) {
        return res.status(403).json({
          message: 'You have no access to this organization.'
        })
      }

      return next()
    } catch (err) {
      const errStatus = err.status ? err.status : 400;

      return res.status(errStatus).json({
        message: err.message,
        details: (err.details) ? err.details : undefined
      })
    }
  }

  /**
   * Finds all organizations belonging to the authenticated user.
   *
   * @returns Promise<Response>
   */
  getAll = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user.id;

    try {
      const { page, perPage } = this.organizationService.validateGetAllParams(req.query);
      const response = await this.organizationService.findAll(userId, page, perPage)

      return res.json(response)
    } catch (err) {
      const errStatus = err.status ? err.status : 400;

      return res.status(errStatus).json({
        message: err.message,
        details: (err.details) ? err.details : undefined
      })
    }
  }

  /**
   * Get one organization belonging to the authenticated user.
   *
   * @returns Promise<Response>
   */
  getOne = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { organizationId } = this.organizationService.validateGetOneParam(req.params);

      const organization = await this.organizationService.findOne(organizationId);

      return res.json(organization)
    } catch (err) {
      const errStatus = err.status ? err.status : 400;

      return res.status(errStatus).json({
        message: err.message,
        details: (err.details) ? err.details : undefined
      })
    }
  }

  getPublications = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { organizationId } = this.organizationService.validateGetOneParam(req.params);

      const publications = await this.organizationService.findPublications(organizationId);

      return res.json(publications)
    } catch (err) {
      const errStatus = err.status ? err.status : 400;

      return res.status(errStatus).json({
        message: err.message,
        details: (err.details) ? err.details : undefined
      })
    }
  }

  getUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { organizationId } = this.organizationService.validateGetOneParam(req.params);

      const users = await this.organizationService.findUsers(organizationId);

      return res.json(users)
    } catch (err) {
      const errStatus = err.status ? err.status : 400;

      return res.status(errStatus).json({
        message: err.message,
        details: (err.details) ? err.details : undefined
      })
    }
  }

  getCustomer = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { organizationId } = this.organizationService.validateGetOneParam(req.params);

      const customer = await this.organizationService.findCustomer(organizationId);

      const { stripeCustomerId } = customer;

      if (!stripeCustomerId) {
        return res.status(204).send()
      }

      const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);

      return res.json({
        ...customer,
        stripeCustomer
      });
    } catch (err) {
      const errStatus = err.status ? err.status : 400;

      return res.status(errStatus).json({
        message: err.message,
        details: (err.details) ? err.details : undefined
      })
    }
  }

  getAdmin = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { organizationId } = this.organizationService.validateGetOneParam(req.params);

      const admin = await this.organizationService.findAdmin(organizationId);

      return res.json(admin);
    } catch (err) {
      const errStatus = err.status ? err.status : 400;

      return res.status(errStatus).json({
        message: err.message,
        details: (err.details) ? err.details : undefined
      })
    }
  }

  /**
   * Changes the admin of this organization. The user must already exist.
   * Only admins of an organization can do this.
   */
  putAdmin = async (req: Request, res: Response): Promise<Response> => {
    const { adminId } = req.body;
    const userId = req.user.id;

    try {
      const { organizationId } = this.organizationService.validateGetOneParam(req.params);

      const organization = await this.organizationService.changeAdmin(organizationId, userId, adminId);

      return res.json(organization);
    } catch (err) {
      const errStatus = err.status ? err.status : 400;

      return res.status(errStatus).json({
        message: err.message,
        details: (err.details) ? err.details : undefined
      })
    }
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
}
