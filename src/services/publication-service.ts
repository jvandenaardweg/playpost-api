import { getRepository, Repository } from 'typeorm';

import { Publication } from '../database/entities/publication';
import { BaseService } from './index';

export class PublicationService extends BaseService {
  private publicationRepository: Repository<Publication>;

  constructor () {
    super()
    this.publicationRepository = getRepository(Publication);
  }

  /**
   * Get's all publication's the user has access to. The publication includes the organization relation.
   *
   * @param userId
   * @param page 
   * @param perPage 
   * @param skip 
   * @param take 
   */
  async findAllPublicationsForUser(userId: string): Promise<Publication[]> {
    const publications = await this.publicationRepository
      .createQueryBuilder('publication')
      .innerJoin('publication.users', 'user', 'user.id = :userId', { userId })
      .leftJoinAndSelect('publication.organization', 'organization') // required
      .getMany()

    return publications
  }

  public findOneByIdOfUser = async (publicationId: string, userId: string) => {
    return this.publicationRepository
      .createQueryBuilder('publication')
      .innerJoin('publication.users', 'user', 'user.id = :userId', { userId })
      .leftJoinAndSelect("publication.users", "users")
      .leftJoinAndSelect("publication.organization", "organization")
      .where('publication.id = :publicationId', { publicationId })
      .getOne()
  }

  /**
   * Find a publication by ID with and include all it's relations.
   *
   * Relations required: user (to determine access)
   */
  public findOneById = async (publicationId: string) => {
    return this.publicationRepository.findOne(publicationId, {
      relations: ['users']
    });
  }

  public save = async (newPublication: Publication) => {
    return this.publicationRepository.save(newPublication);
  }

  public remove = async (publication: Publication) => {
    return this.publicationRepository.remove(publication);
  }
}
