import { NextFunction, Request, Response } from 'express';
import { getRepository, Repository } from 'typeorm';
import { stripe } from '../../billing';
import { Organization } from '../../database/entities/organization';
import { Publication } from '../../database/entities/publication';
import { User } from '../../database/entities/user';
import * as AWSSes from '../../mailers/aws-ses';
import { OrganizationService } from '../../services/organizationService';
import { PermissionRoles } from '../../typings';
import { BaseController } from '../index';

export class OrganizationsController extends BaseController {
  organizationRepository: Repository<Organization>;
  publicationRepository: Repository<Publication>;
  userRepository: Repository<User>;
  organizationService: OrganizationService;

  constructor() {
    super()
    this.organizationRepository = getRepository(Organization);
    this.publicationRepository = getRepository(Publication);
    this.userRepository = getRepository(User);
    this.organizationService = new OrganizationService();
  }

  /**
   * Handles access permissions.
   */
  permissions = (roles: PermissionRoles) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
      const userId = req.user.id;
      const { organizationId } = req.params;

      try {
        if (Object.keys(req.params).length) {
          // Validate
          this.validateGetOneParam(req.params);
        }

        // If the role is a user (so every authenticated user), skip the resource permission check
        if (roles.includes('user')) {
          return next();
        }

        // If we end up here, we want to check if the authenticated user has permission to view this organization

        // Get the organization so we can determine if the user is an admin or normal user of this resource
        const organization = await this.organizationService.findOne(organizationId);

        // Only allow access to this resource if it's a user or admin
        const isAdminInOrganization = organization.admin.id === userId;
        const isUserInOrganization = organization.users.some(user => user.id === userId);

        if (roles.includes('organization-user') && !isUserInOrganization && !isAdminInOrganization) {
          return res.status(403).json({
            message: 'You have no access to this organization.'
          });
        }

        if (roles.includes('organization-admin') && !isAdminInOrganization) {
          return res.status(403).json({
            message: 'You have no admin access to this organization.'
          });
        }

        return next();
      } catch (err) {
        return this.handleError(err, res);
      }
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
      const requestQuery = this.validatePagingParams(req.query);
      const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
      const response = await this.organizationService.findAll(userId, page, perPage, skip, take);

      return res.json(response);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Get one organization belonging to the authenticated user.
   *
   * @returns Promise<Response>
   */
  getOne = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const organization = await this.organizationService.findOne(organizationId);

      return res.json(organization);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  getPublications = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const requestQuery = this.validatePagingParams(req.query);
      const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
      const publications = await this.organizationService.findAllPublications(organizationId, page, perPage, skip, take);

      return res.json(publications);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Get all users within the organization.
   */
  getUsers = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const requestQuery = this.validatePagingParams(req.query);
      const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
      const users = await this.organizationService.findAllUsers(organizationId, page, perPage, skip, take);

      return res.json(users);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Get the customer information of the organization. This includes data from Stripe.
   */
  getCustomer = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const customer = await this.organizationService.findOneCustomer(organizationId);

      const { stripeCustomerId } = customer;

      if (!stripeCustomerId) {
        return res.status(204).send();
      }

      const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);

      return res.json({
        ...customer,
        stripeCustomer
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Get the admin user of the organization.
   */
  getAdmin = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;

    try {
      const admin = await this.organizationService.findOneAdmin(organizationId);

      return res.json(admin);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Changes the admin of this organization. The user must already exist.
   * Only admins of an organization can do this.
   */
  putAdmin = async (req: Request, res: Response): Promise<Response> => {
    const { organizationId } = req.params;
    const { newAdminUserId } = req.body;
    const userId = req.user.id;

    try {
      const updatedOrganization = await this.organizationService.saveAdmin(organizationId, userId, newAdminUserId);

      return res.json(updatedOrganization);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Creates a publication for the selected organization.
   */
  createPublication = async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { name, url } = req.body;
    const userId = req.user.id;

    try {
      // When we end up here, the user is allowed to create a publiction for this organization

      const organization = await this.organizationRepository.findOne(organizationId, {
        select: ['id', 'name', 'admin']
      });

      if (!organization) {
        return res.status(404).json({
          message: 'Organization could not be found.'
        });
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
        });
      }

      const newPublication = new Publication();

      newPublication.name = name;
      newPublication.url = url;
      newPublication.users = [user]; // Connect the admin to this publication so he has access to it
      newPublication.organization = organization; // Connect the organization of the user to the publication

      // Create the publication and attach it to the organization and user (admin)
      const createdPublication = await this.publicationRepository.save(newPublication);

      return res.json(createdPublication);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Associates a existing user to an organization
   */
  createUser = async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { email } = req.body;

    try {
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
        });
      }

      const organization = await this.organizationRepository.findOne(organizationId, {
        relations: ['users'] // Important: we need the current users to push the new user into that array
      });

      if (!organization) {
        return res.status(404).json({
          message: 'The organization does not exist.'
        });
      }

      const userExistsInOrganization = organization.users.some(organizationUser => organizationUser.id === newUser.id);

      if (userExistsInOrganization) {
        return res.status(409).json({
          message: 'The user already exists in this organization.'
        });
      }

      // Attach existing users and new user to the organization
      organization.users.push(newUser);

      const updatedOrganization = await this.organizationRepository.save(organization);

      await AWSSes.sendTransactionalEmail(
        newUser.email,
        `You have been added to organization: ${updatedOrganization.name}`,
        `
          <p>Hi,</p>
          <p>This is an e-mail to confirm you have been added to organization <strong>${updatedOrganization.name}</strong>.</p>
          <p><a href="${process.env.PUBLISHERS_BASE_URL}">Login</a></p>
        `
      )

      return res.json(updatedOrganization);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    const { organizationId, userId } = req.params;

    try {
      const organization = await this.organizationRepository.findOne(organizationId, {
        relations: ['users'] // Important: we need the current users to update the array
      });

      if (!organization) {
        return res.status(404).json({
          message: 'The organization does not exist.'
        });
      }

      const userExistsInOrganization = organization.users.some(organizationUser => organizationUser.id === userId);

      if (!userExistsInOrganization) {
        return res.status(409).json({
          message: 'The user does not exist in this organization.'
        });
      }

      // Filter out the user we want to delete
      const usersWithoutUserToDelete = organization.users.filter(organizationUser => organizationUser.id !== userId);
      const userToDelete = organization.users.find(organizationUser => organizationUser.id === userId);

      // Set the new users, without the deleted user
      organization.users = usersWithoutUserToDelete;

      const updatedOrganization = await this.organizationRepository.save(organization);

      if (userToDelete) {
        await AWSSes.sendTransactionalEmail(
          userToDelete.email,
          `You have been removed from organization: ${updatedOrganization.name}`,
          `
            <p>Hi,</p>
            <p>This is an e-mail to confirm you have been removed from organization <strong>${updatedOrganization.name}</strong>.</p>
            <p>If this is correct, you can safely ignore and remove this email.</p.
            <p>If you think this is incorrect, please reach out to us.</p>
          `
        )
      }

      return res.json(updatedOrganization);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * Deletes a publication from the database.
   * IMPORTANT: Very destructive operation.
   */
  deletePublication = async (req: Request, res: Response) => {
    const { organizationId, publicationId } = req.params;

    try {
      const organization = await this.organizationRepository.findOne(organizationId, {
        relations: ['publications']
      });

      if (!organization) {
        return res.status(404).json({
          message: 'The organization does not exist.'
        });
      }

      const publication = await this.publicationRepository.findOne(publicationId);

      if (!publication) {
        return res.status(404).json({
          message: 'Publication does not exist.'
        });
      }

      // TODO: delete publication articles
      // TODO: delete publication audiofiles

      await this.publicationRepository.remove(publication);

      return res.status(200).send();
    } catch (err) {
      return this.handleError(err, res);
    }
  };
}
