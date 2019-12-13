
import { Request, Response } from 'express';
import { getRepository, Repository } from 'typeorm';
import { Organization } from '../../database/entities/organization';

export class OrganizationsController {
  organizationRepository: Repository<Organization>;

  constructor() {
    this.organizationRepository = getRepository(Organization);
  }

  getOrganizations = async (req: Request, res: Response) => {
    const userId = req.user.id;

    const organization = await this.organizationRepository.findOne({
      where: {
        admin: {
          id: userId
        }
      }
    })

    if (!organization) {
      return res.status(404).json({
        message: 'You have no access an organization.'
      })
    }

    return res.json(organization)
  }

  getOrganization = async (req: Request, res: Response) => {
    const { organizationId } = req.params;

    const organization = await this.organizationRepository.findOne(organizationId);

    return res.json(organization)
  }
}
