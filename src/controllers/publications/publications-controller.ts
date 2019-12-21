
import { NextFunction, Request, Response } from 'express';

import { HttpError, HttpStatus } from '../../http-error';
import { ArticleService } from '../../services/ArticleService';
import { PublicationService } from '../../services/PublicationService';
import { BaseController } from '../index';

export class PublicationsController extends BaseController {
  private publicationService: PublicationService;
  private articleService: ArticleService;

  constructor() {
    super();

    this.articleService = new ArticleService()
    this.publicationService = new PublicationService();
  }

  /**
   * Method to make sure the logged-in user is the owner of the Publication.
   */
  public restrictResourceToOwner = async (req: Request, res: Response, next: NextFunction) => {
    const { publicationId } = req.params;
    const userId = req.user!.id;

    const publication = await this.publicationService.findOneById(publicationId);

    if (!publication) {
      throw new HttpError(HttpStatus.NotFound, 'The publication could not be found.');
    }

    const isPublicationOfUser = !!publication.users.find(user => user.id === userId);

    if (!isPublicationOfUser) {
      throw new HttpError(HttpStatus.Forbidden, 'You have no access to this publication.');
    }

    return next()
  }

  /**
   * Get the publications the user has access to.
   */
  public getAll = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const requestQuery = this.validatePagingParams(req.query);
    const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    const response = await this.publicationService.findAll(userId, page, perPage, skip, take);

    return res.json(response);
  }

  public getOne = async (req: Request, res: Response) => {
    const { publicationId } = req.params;
    const userId = req.user!.id;

    const publicationOfUser = await this.publicationService.findOneByIdOfUser(publicationId, userId);

    return res.json(publicationOfUser);
  }

  public getAllArticles = async (req: Request, res: Response): Promise<Response> => {
    const { publicationId } = req.params;

    const requestQuery = this.validatePagingParams(req.query);
    const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    const where = 'publication.id = :publicationId';
    const parameters = { publicationId };
    const articleSummariesResponse = await this.articleService.findAllSummaries(where, parameters, page, perPage, skip, take);

    return res.json(articleSummariesResponse)
  }

  public getArticle = async (req: Request, res: Response) => {
    const { publicationId, articleId } = req.params;

    const article = await this.articleService.findOneById(articleId, {
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

    const article = await this.articleService.findOneById(articleId, {
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

    await this.articleService.remove(article);

    // TODO: delete audiofiles

    return res.status(200).send();
  }
}
