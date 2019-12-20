
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
    const userId = req.user!.id;

    const publicationExists = await this.publicationsRepository.findOne(publicationId, {
      select: ['id']
    });

    if (!publicationExists) {
      return res.status(404).json({
        message: 'The publication could not be found.'
      });
    }

    const publicationOfUser = await getConnection()
      .getRepository(Publication)
      .createQueryBuilder('publication')
      .innerJoin('publication.users', 'user', 'user.id = :userId', { userId })
      .where('publication.id = :publicationId', { publicationId })
      .getOne()

    if (!publicationOfUser) {
      return res.status(403).json({
        message: 'You have no access to this publication.'
      })
    }

    return next()
  }

  /**
   * Get the publications the user has access to.
   */
  getAll = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Get all the publications the user has access to
    const [publications, total] = await getConnection()
      .getRepository(Publication)
      .createQueryBuilder('publication')
      .innerJoin('publication.users', 'user', 'user.id = :userId', { userId })
      .getManyAndCount()

    return res.json({
      total,
      data: publications
    })
  }

  getOne = async (req: Request, res: Response) => {
    const { publicationId } = req.params;
    const userId = req.user!.id;

    // Get the specific publication of the user
    const publicationOfUser = await getConnection()
      .getRepository(Publication)
      .createQueryBuilder('publication')
      .innerJoin('publication.users', 'user', 'user.id = :userId', { userId })
      .where('publication.id = :publicationId', { publicationId })
      .getOne()

    return res.json(publicationOfUser)
  }

  getAllArticles = async (req: Request, res: Response): Promise<Response> => {
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

  getArticle = async (req: Request, res: Response) => {
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

  createArticle = async (req: Request, res: Response) => {
    const { publicationId } = req.params;
    const { url } = req.body;

    // const crawledArticle = await fetchFullArticleContents(url);

    // TODO: store in database as "draft" (not public)

    // TODO: create an article with the publication as an owner of that article

    return res.json({ message: 'ok', url, publicationId });
  }

  deleteArticle = async (req: Request, res: Response) => {
    const { publicationId, articleId } = req.params;

    const article = await this.articleRepository.findOne(articleId, {
      where: {
        publication: {
          id: publicationId
        }
      }
    })

    if (!article) {
      return res.status(404).json({
        message: 'Article does not exist.'
      })
    }

    await this.articleRepository.remove(article);

    // TODO: delete audiofiles

    return res.status(200).send();
  }
}
