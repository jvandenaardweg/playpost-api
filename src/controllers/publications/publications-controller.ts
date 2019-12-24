
import joi from '@hapi/joi';
import { NextFunction, Request, Response } from 'express';

import { Article, ArticleStatus } from '../../database/entities/article';
import { HttpError, HttpStatus } from '../../http-error';
import { ArticleService } from '../../services/article-service';
import { PublicationService } from '../../services/publication-service';
import { BaseController } from '../index';

export class PublicationsController extends BaseController {
  private readonly publicationService: PublicationService;
  private readonly articleService: ArticleService;

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

  /**
   * Get one publication the user has access to.
   */
  public getOne = async (req: Request, res: Response) => {
    const { publicationId } = req.params;
    const userId = req.user!.id;

    const publicationOfUser = await this.publicationService.findOneByIdOfUser(publicationId, userId);

    return res.json(publicationOfUser);
  }

  /**
   * Get all article summaries from a publication.
   * This list includes draft articles, which are not available outside the organization.
   */
  public getAllArticles = async (req: Request, res: Response): Promise<Response> => {
    const { publicationId } = req.params;

    const requestQuery = this.validatePagingParams(req.query);
    const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    const where = 'publication.id = :publicationId';
    const parameters = { publicationId };
    const articleSummariesResponse = await this.articleService.findAllSummaries(where, parameters, page, perPage, skip, take);

    return res.json(articleSummariesResponse)
  }

  /**
   * Get a single article of a publication.
   */
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

  /**
   * Inserts an article in our database using a URL. Our crawler will fetch the required article contents.
   * Article is stored as a "draft", so it's not publicaly available (yet).
   *
   */
  public createImportArticle = async (req: Request, res: Response) => {
    const { publicationId } = req.params;
    const { url } = req.body;

    const validationSchema = joi.object().keys({
      publicationId: joi.string().uuid().required(),
      url: joi.string().uri().required()
    });

    const userValidationResult = validationSchema.validate({ ...req.body, ...req.params });

    if (userValidationResult.error) {
      const firstError = userValidationResult.error.details[0];
      throw new HttpError(HttpStatus.BadRequest, firstError.message, userValidationResult.error.details);
    }

    const publication = await this.publicationService.findOneById(publicationId);

    if (!publication) {
      throw new HttpError(HttpStatus.NotFound, 'Publication does not exist.');
    }

    // Find out if this publication already has this article URL
    const existingArticle = await this.articleService.findOne({
      where: [
        { canonicalUrl: url },
        { url }
      ]
    })

    if (existingArticle && existingArticle.publication && existingArticle.publication.id === publicationId) {
      throw new HttpError(
        HttpStatus.Conflict,
        `This publication already has this article: ${existingArticle.title}`,
        {
          article: existingArticle
        }
      );
    }

    // Publication does not already have this article, crawl it...
    const crawledArticle = await this.articleService.fetchArticleByUrl(url);

    if (!crawledArticle.language) {
      throw new HttpError(HttpStatus.BadRequest, 'We cannot automatically import this article because the language of this article could not be detected.');
    }

    // Insert the crawled article as a draft
    crawledArticle.status = ArticleStatus.DRAFT;

    // Attach the article to this publication
    crawledArticle.publication = publication;

    // Mark this article always as compatible
    // This compatibility message is only used in our App to automatically determine if the article is compatible
    // We do not need that kind of information when the user manually imports an article and edits it
    crawledArticle.isCompatible = true;
    crawledArticle.compatibilityMessage = undefined;

    const savedArticle = await this.articleService.save(crawledArticle);

    return res.json(savedArticle);
  };

  public createArticle = async (req: Request, res: Response) => {
    const { publicationId } = req.params;
    const { url } = req.body;

    const validationSchema = joi.object().keys({
      title: joi.string().required(),
      description: joi.string().required(),
      url: joi.string().uri().required(),
      canonicalUrl: joi.string().uri().required(),
      sourceName: joi.string().required(),
      imageUrl: joi.string().uri().optional(),
      authorName: joi.string().optional(),
      html: joi.string().required(),
      ssml: joi.string().required(),
      voice: joi.object().keys({
        id: joi.string().uuid().required()
      }).required()
    });

    const userValidationResult = validationSchema.validate(req.body, {
      abortEarly: false // Return all error details
    });

    if (userValidationResult.error) {
      const firstError = userValidationResult.error.details[0];

      throw new HttpError(HttpStatus.BadRequest, firstError.message, userValidationResult.error.details);
    }

    // TODO: get readingtime from html
    // const readingTime = 0;

    // const crawledArticle = await fetchFullArticleContents(url);

    // TODO: store in database as "draft" (not public)

    // TODO: create an article with the publication as an owner of that article

    return res.json({ message: 'ok', url, publicationId });
  }

  /**
   * Deletes a single article from a publication.
   */
  public deleteArticle = async (req: Request, res: Response) => {
    const { publicationId, articleId } = req.params;

    const validationSchema = joi.object().keys({
      publicationId: joi.string().uuid().required(),
      articleId: joi.string().uuid().required()
    });

    const userValidationResult = validationSchema.validate(req.params);

    if (userValidationResult.error) {
      const firstError = userValidationResult.error.details[0];
      throw new HttpError(HttpStatus.BadRequest, firstError.message, userValidationResult.error.details);
    }

    const article = await this.articleService.findOneById(articleId, {
      where: {
        publication: {
          id: publicationId
        }
      }
    })

    if (!article) {
      throw new HttpError(HttpStatus.NotFound, 'Article does not exist.');
    }

    // TODO: find out if article already exists in playlists
    // TODO: find out if article already has audiofiles

    await this.articleService.remove(article);

    // TODO: delete audiofiles

    return res.status(HttpStatus.NoContent).send();
  }

  public createAudiofile = async (req: Request, res: Response) => {
    // const { publicationId, articleId } = req.params;

    return res.json({
      message: 'Should create audiofile'
    })
  }

  public patchArticle = async (req: Request, res: Response) => {
    const { articleId, publicationId } = req.params;

    const validationSchema = joi.object().keys({
      publicationId: joi.string().uuid().required(),
      articleId: joi.string().uuid().required(),

      // All properties are optional so we can just update a single property
      url: joi.string().uri().optional(),
      title: joi.string().optional(),
      canonicalUrl: joi.string().optional(),
      status: joi.string().valid('draft', 'finished').lowercase().optional(),
      readingTime: joi.number().optional(),
      html: joi.string().optional(),
      ssml: joi.string().optional(),
      sourceName: joi.string().optional(),
      imageUrl: joi.string().uri().optional(),
      description: joi.string().optional(),
      authorName: joi.string().optional(),
    });

    const userValidationResult = validationSchema.validate({ ...req.body, ...req.params }, {
      allowUnknown: false // Do not allow other properties to be updated
    });

    if (userValidationResult.error) {
      const firstError = userValidationResult.error.details[0];
      throw new HttpError(HttpStatus.BadRequest, firstError.message, userValidationResult.error.details);
    }

    if (!Object.keys(req.body).length) {
      throw new HttpError(HttpStatus.BadRequest, 'Nothing to update.');
    }

    const currentArticle = await this.articleService.findOneById(articleId, {
      where: {
        publication: {
          id: publicationId
        }
      }
    });

    if (!currentArticle) {
      throw new HttpError(HttpStatus.NotFound, 'The article does not exist.');
    }

    const updatedArticleProperties = new Article();

    // Only add the updated properties
    Object.keys(req.body).map(property => {
      updatedArticleProperties[property] = req.body[property];
    });

    // TODO: if html/ssml changes, also create a new audiofile?

    await this.articleService.update(articleId, updatedArticleProperties);

    return res.status(HttpStatus.NoContent).send()

  }
}
