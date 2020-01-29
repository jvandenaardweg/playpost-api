
import joi from '@hapi/joi';
import { NextFunction, Request, Response } from 'express';

import { Article, ArticleStatus } from '../../database/entities/article';
import { HttpError, HttpStatus } from '../../http-error';
import { Sentry } from '../../sentry';
import { ArticleService } from '../../services/article-service';
import { AudiofileService } from '../../services/audiofile-service';
import { OrganizationService } from '../../services/organization-service';
import { PublicationService } from '../../services/publication-service';
import { SynthesizerService } from '../../services/synthesizer-service';
import { UsageRecordService } from '../../services/usage-record-service';
import { VoiceService } from '../../services/voice-service';
import { BaseController } from '../index';

export class PublicationsController extends BaseController {
  private readonly publicationService: PublicationService;
  private readonly articleService: ArticleService;
  private readonly voiceService: VoiceService;
  private readonly audiofileService: AudiofileService;
  private readonly usageRecordService: UsageRecordService;
  private readonly organizationService: OrganizationService;

  constructor() {
    super();

    this.articleService = new ArticleService()
    this.publicationService = new PublicationService();
    this.voiceService = new VoiceService();
    this.audiofileService = new AudiofileService();
    this.usageRecordService = new UsageRecordService();
    this.organizationService = new OrganizationService();
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

    const isPublicationOfUser = !!publication.users && publication.users.find(user => user.id === userId);

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
      },
      // TODO: make better
      select: ['id', 'ssml', 'language', 'canonicalUrl', 'compatibilityMessage', 'createdAt', 'updatedAt', 'description', 'imageUrl', 'isCompatible', 'authorName', 'readingTime', 'sourceName', 'status', 'title']
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
    const { publicationId, articleId } = req.params;
    const { voiceId, organizationId } = req.body;
    const userId = req.user!.id;

    const validationSchema = joi.object().keys({
      publicationId: joi.string().uuid().required(),
      articleId: joi.string().uuid().required(),
      voiceId: joi.string().uuid().required(),
      organizationId: joi.string().uuid().required()
    });

    const validationResult = validationSchema.validate({ ...req.body, ...req.params });

    if (validationResult.error) {
      const firstError = validationResult.error.details[0];
      throw new HttpError(HttpStatus.BadRequest, firstError.message, validationResult.error.details);
    }

    // Get the organization to verify if this publication is part of that organization
    // We need the organizationId to record usage
    const organization = await this.organizationService.findOneById(organizationId);

    if (!organization) {
      throw new HttpError(HttpStatus.NotFound, 'Organization not found.');
    }

    if (!organization.publications) {
      throw new HttpError(HttpStatus.NotFound, 'Publication not found.');
    }

    // Make sure the publication is part of the organization
    if (!organization.publications.find(publication => publication.id !== publicationId)) {
      throw new HttpError(HttpStatus.NotFound, 'Publication is not part of the given organization.');
    }

    // When we end up here, the publication exists, and the given organizationId has access to that publication

    // Get the subscriptions of the organization customer
    const subscriptions = await this.organizationService.findAllCustomerSubscriptions(organizationId);

    if (!subscriptions || !subscriptions.length) {
      throw new HttpError(HttpStatus.PaymentRequired, 'You have no active subscription. This action requires an active subscription.');
    }

    // Get the first subscription item id, as an organization can only have 1 active subscription, not multiple
    const stripeSubscriptionItemId = subscriptions[0].items.data[0].id;

    if (!stripeSubscriptionItemId) {
      throw new HttpError(HttpStatus.PaymentRequired, 'A subscription item id does not exist.');
    }

    const article = await this.articleService.findOneById(articleId, {
      where: {
        publication: {
          id: publicationId
        }
      }
    });

    if (!article) {
      throw new HttpError(HttpStatus.NotFound, 'Article does not exist.');
    }

    if (!article.ssml) {
      throw new HttpError(HttpStatus.BadRequest, 'Article has no SSML, cannot create audio for this article.');
    }

    const voice = await this.voiceService.findOneByIdWhereActive(voiceId);

    if (!voice) {
      throw new HttpError(HttpStatus.NotFound, 'Active voice does not exist.')
    }

    // When we end up here, everything is OK, we can synthesize now.

    const synthesizerService = new SynthesizerService(voice.synthesizer);

    const newAudiofile = await synthesizerService.uploadArticleAudio(article.id, userId, voice.id, {
      outputFormat: 'mp3',
      ssml: article.ssml,
      voiceLanguageCode: voice.languageCode,
      voiceName: voice.name,
      voiceSsmlGender: voice.gender
    })

    const createdAudiofile = await this.audiofileService.save(newAudiofile);

    // Track usage in our database and in Stripe
    // The user will see the "quantity" on their invoice
    await this.usageRecordService.createUsageRecord({
      articleId,
      audiofileId: createdAudiofile.id,
      stripeSubscriptionItemId,
      organizationId,
      publicationId,
      userId,
      quantity: article.ssml.length,
      isMetered: true // Sends metered usage to Stripe
    })

    return res.json(createdAudiofile)
  }

  /**
   * Previews a small ssml paragraph.
   */
  public previewArticleSSML = async (req: Request, res: Response) => {
    const { publicationId, articleId } = req.params;
    const { ssml, voiceId } = req.body;

    const validationSchema = joi.object().keys({
      publicationId: joi.string().uuid().required(),
      articleId: joi.string().uuid().required(),
      voiceId: joi.string().uuid().required(),
      ssml: joi.string().required()
    });

    const validationResult = validationSchema.validate({ ...req.body, ...req.params });

    if (validationResult.error) {
      const firstError = validationResult.error.details[0];
      throw new HttpError(HttpStatus.BadRequest, firstError.message, validationResult.error.details);
    }

    // TODO: make sure to limit the usage of this endpoint to prevent abuse
    // As previewing does not cost the user anything, but costs us money

    // To prevent abuse, we set a max. We need to figure out if this max is enough.
    if (ssml.length > 2000) {
      const errorMessage = 'Paragraph length is too long to be previewed.';
      Sentry.captureMessage(errorMessage, Sentry.Severity.Critical);
      throw new HttpError(HttpStatus.BadRequest, errorMessage)
    }

    const article = await this.articleService.findOneById(articleId, {
      where: {
        publication: {
          id: publicationId
        }
      }
    });

    if (!article) {
      throw new HttpError(HttpStatus.NotFound, 'Article does not exist.');
    }

    const voice = await this.voiceService.findOneByIdWhereActive(voiceId);

    if (!voice) {
      throw new HttpError(HttpStatus.NotFound, 'Active voice does not exist.')
    }

    const synthesizerService = new SynthesizerService(voice.synthesizer);

    const audioBase64String = await synthesizerService.preview({
      outputFormat: 'mp3',
      ssml,
      voiceLanguageCode: voice.languageCode,
      voiceName: voice.name,
      voiceSsmlGender: voice.gender
    });

    return res.json({
      audio: audioBase64String
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
