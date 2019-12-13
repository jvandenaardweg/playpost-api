
import { NextFunction, Request, Response } from 'express';
import { getConnection, getCustomRepository, getRepository, Repository } from 'typeorm';
import { Organization } from '../../database/entities/organization';
import { Publication } from '../../database/entities/publication';
import { ArticleRepository } from '../../database/repositories/article';
import { UserRepository } from '../../database/repositories/user';

export class PublicationsController {
  publicationsRepository: Repository<Publication>;
  organizationRepository: Repository<Organization>;
  articleRepository: ArticleRepository;
  userRepository: UserRepository;

  constructor() {
    this.publicationsRepository = getRepository(Publication);
    this.articleRepository = getCustomRepository(ArticleRepository);
    this.userRepository = getCustomRepository(UserRepository);
    this.organizationRepository = getRepository(Organization);
  }

  /**
   * Method to make sure the logged-in user is the owner of the Publication.
   */
  restrictResourceToOwner = async (req: Request, res: Response, next: NextFunction) => {
    const { publicationId } = req.params;
    const userId = req.user.id;

    const publication = await this.publicationsRepository.findOne(publicationId);

    if (!publication) {
      return res.status(404).json({ message: 'The publication could not be found.' });
    }

    // Find the publication the user has access to
    const userPublication = await getConnection()
      .getRepository(Publication)
      .createQueryBuilder('publication')
      .leftJoinAndSelect('publication.organization', 'organization', 'organization.admin = :userId', { userId })
      .where('publication.id = :publicationId', { publicationId })
      .getOne()

    if (!userPublication) {
      return res.status(403).json({ message: 'You have no access to this publication.' });
    }

    return next()
  }

  createPublication = async (req: Request, res: Response) => {
    const { name } = req.body;
    const userId = req.user.id;

    // Find if the user is an admin of an organization
    const organization = await this.organizationRepository.findOne({
      where: {
        admin: {
          id: userId
        }
      }
    })

    if (!organization) {
      return res.status(401).json({
        message: 'You cannot create a new publication because you are not an admin an organization.'
      })
    }

    // Create the publication and attach it to the organization
    const createdPublication = await this.publicationsRepository.save({
      name,
      organization: {
        id: organization.id
      }
    })

    return res.json(createdPublication)
  }

  /**
   * Get the publications the user has access to.
   */
  getPublications = async (req: Request, res: Response) => {
    const userId = req.user.id;

    const publications = await getConnection()
      .getRepository(Publication)
      .createQueryBuilder('publication')
      .leftJoinAndSelect('publication.organization', 'organization', 'organization.admin = :userId', { userId })
      .getMany()

    return res.json(publications)
  }

  getPublication = async (req: Request, res: Response) => {
    const { publicationId } = req.params;

    // Get the publication info of the logged in user
    const publication = await this.publicationsRepository.findOne(publicationId);

    return res.json(publication)
  }

  getPublicationArticles = async (req: Request, res: Response): Promise<Response> => {
    const { page, perPage } = req.query;
    const { publicationId } = req.params;

    const articleSummariesResponse = await this.articleRepository.findSummaryOrFail({
      where: {
        publication: {
          id: publicationId
        }
      }
    }, page, perPage);

    return res.json(articleSummariesResponse)
  }

  getPublicationArticle = async (req: Request, res: Response) => {
    const { publicationId, articleId } = req.params;

    const article = await this.articleRepository.findOneOrFail(articleId, {
      where: {
        publication: {
          id: publicationId
        }
      }
    })

    return res.json(article)
  }

  createPublicationArticle = async (req: Request, res: Response) => {
    const { publicationId } = req.params;
    const { url } = req.body;

    // const crawledArticle = await fetchFullArticleContents(url);

    // TODO: store in database as "draft" (not public)

    // TODO: create an article with the publication as an owner of that article

    return res.json({ message: 'ok', url, publicationId });
  }
}
