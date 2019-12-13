
import { NextFunction, Request, Response } from 'express';
import { getRepository, Repository, getConnection } from 'typeorm';
import { Organization } from '../../database/entities/organization';
import { Publication } from '../../database/entities/publication';
import { User } from '../../database/entities/user';

export class OrganizationsController {
  organizationRepository: Repository<Organization>;
  publicationRepository: Repository<Publication>;
  userRepository: Repository<User>;

  constructor() {
    this.organizationRepository = getRepository(Organization);
    this.publicationRepository = getRepository(Publication);
    this.userRepository = getRepository(User);
  }

  restrictResourceToOwner = async (req: Request, res: Response, next: NextFunction) => {
    const { organizationId } = req.params;
    const userId = req.user.id;

    const organization = await this.organizationRepository.findOne(organizationId, {
      select: ['id', 'admin']
    });

    if (!organization) {
      return res.status(404).json({
        message: 'The organization could not be found.'
      });
    }

    if (organization.admin.id !== userId) {
      return res.status(401).json({
        message: 'You have no access to this organization.'
      })
    }

    return next()
  }

  getOrganizations = async (req: Request, res: Response) => {
    const userId = req.user.id;

    const [organizations, total] = await getConnection()
      .getRepository(Organization)
      .createQueryBuilder('organization')
      .innerJoin('organization.users', 'user', 'user.id = :userId', { userId })
      // .where('organization.id = :publicationId', { publicationId })
      .getManyAndCount()

    return res.json({
      total,
      data: organizations
    })
  }

  getOrganization = async (req: Request, res: Response) => {
    const { organizationId } = req.params;

    const organization = await this.organizationRepository.findOne(organizationId, {
      relations: ['customer', 'publications']
    });

    return res.json(organization)
  }

  createPublication = async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    // Find if the user is an admin of an organization
    // Only admins of an organization can create new publications
    const organization = await this.organizationRepository.findOne(organizationId, {
      where: {
        admin: {
          id: userId
        }
      }
    })

    if (!organization) {
      return res.status(401).json({
        message: `You cannot create a new publication because you are not an admin of organization: ${organization}`
      })
    }

    const newPublication = new Publication();

    newPublication.name = name;
    newPublication.users = [organization.admin]; // Connect the admin to this publication so he has access to it
    newPublication.organization = organization; // Connect the organization of the user to the publication

    // Create the publication and attach it to the organization and user (admin)
    const createdPublication = await this.publicationRepository.save(newPublication)

    return res.json(createdPublication)
  }
}
