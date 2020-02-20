import { getRepository, Repository } from 'typeorm';

import { Publication } from '../database/entities/publication';
import { CollectionResponse } from '../typings';
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
  async findAll(userId: string, page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<Publication[]>> {
    const [publications, total] = await this.publicationRepository
      .createQueryBuilder('publication')
      .innerJoin('publication.users', 'user', 'user.id = :userId', { userId })
      .leftJoinAndSelect('publication.organization', 'organization') // required
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