
import { NextFunction, Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { ArticleRepository } from '../../database/repositories/article';
import { PublisherRepository } from '../../database/repositories/publisher';
import { UserRepository } from '../../database/repositories/user';

export class PublishersController {
  publisherRepository: PublisherRepository;
  articleRepository: ArticleRepository;
  userRepository: UserRepository;

  constructor() {
    this.publisherRepository = getCustomRepository(PublisherRepository);
    this.articleRepository = getCustomRepository(ArticleRepository);
    this.userRepository = getCustomRepository(UserRepository);
  }

  /**
   * Method to make sure the logged-in user is the owner of the publisher.
   */
  restrictResourceToOwner = async (req: Request, res: Response, next: NextFunction) => {
    const { publisherId } = req.params;
    const userId = req.user.id;

    const publisher = await this.publisherRepository.findOne(publisherId, {
      where: {
        user: {
          id: userId
        }
      },
      relations: ['user']
    });

    if (!publisher) {
      return res.status(404).json({ message: 'Publisher could not be not found.' });
    }

    if (publisher.user.id !== userId) {
      return res.status(403).json({ message: 'You have no access to this publisher.' });
    }

    return next()
  }

  createPublisher = async (req: Request, res: Response) => {
    const { name } = req.body;
    const userId = req.user.id;

    const existingPublisher = await this.publisherRepository.findOne({
      where: {
        user: {
          id: userId
        }
      }
    })

    if (existingPublisher) {
      return res.status(403).json({
        message: `Cannot create a new publisher for you, because you already are connected to a publisher: ${existingPublisher.name}`
      })
    }

    // Create the publisher and attach it to the user
    const createdPublisher = await this.publisherRepository.save({
      name,
      user: {
        id: userId
      }
    })

    return res.json(createdPublisher)
  }

  /**
   * Get the publisher the user has access to.
   */
  getPublishers = async (req: Request, res: Response) => {
    const userId = req.user.id;

    const publishers = await this.publisherRepository.findOne({
      where: {
        user: {
          id: userId
        }
      }
    });

    return res.json(publishers)
  }

  getPublisher = async (req: Request, res: Response) => {
    const { publisherId } = req.params;

    // Get the publisher info of the logged in user
    const publisher = await this.publisherRepository.findOne(publisherId, {
      relations: ['user']
    });

    return res.json(publisher)
  }

  getPublisherArticles = async (req: Request, res: Response): Promise<Response> => {
    const { page, perPage } = req.query;
    const { publisherId } = req.params;

    const articleSummariesResponse = await this.articleRepository.findSummaryOrFail({
      where: {
        publisher: {
          id: publisherId
        }
      }
    }, page, perPage);

    return res.json(articleSummariesResponse)
  }

  getPublisherArticle = async (req: Request, res: Response) => {
    const { publisherId, articleId } = req.params;

    const article = await this.articleRepository.findOneOrFail(articleId, {
      where: {
        publisher: {
          id: publisherId
        }
      }
    })

    return res.json(article)
  }

  createPublisherArticle = async (req: Request, res: Response) => {
    const { publisherId } = req.params;
    const { url } = req.body;

    // const crawledArticle = await fetchFullArticleContents(url);

    // TODO: store in database as "draft" (not public)

    // TODO: create an article with the publisher as an owner of that article

    return res.json({ message: 'ok', url, publisherId });
  }
}
