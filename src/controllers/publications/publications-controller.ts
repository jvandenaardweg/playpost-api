
import joi from '@hapi/joi';
import { NextFunction, Request } from 'express';

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
import { PublicationResponse, AudioPreview, DeleteOnePublicationArticleRequest, PostOnePublicationAudiofileRequest, PostOnePublicationPreviewSSMLRequest, PatchOnePublicationArticleRequest, PostOnePublicationArticleRequest, GetAllPublicationArticlesRequest, GetOnePublicationRequest, GetAllPublicationsRequest, GetOnePublicationArticleRequest, PostOnePublicationImportArticleRequest } from './types';
import { FindManyOptions } from 'typeorm';
import { LanguageService } from '../../services/language-service';
import { getPossibleListeningTimeInSeconds } from '../../utils/reading-time';
import { trimTextAtWords, getTextFromSSML, getHTMLFromSSML, getNormalizedUrl } from '../../utils/string';

export class PublicationsController extends BaseController {
  private readonly publicationService: PublicationService;
  private readonly articleService: ArticleService;
  private readonly voiceService: VoiceService;
  private readonly audiofileService: AudiofileService;
  private readonly usageRecordService: UsageRecordService;
  private readonly organizationService: OrganizationService;
  private readonly languageService: LanguageService;

  constructor() {
    super();

    this.articleService = new ArticleService()
    this.publicationService = new PublicationService();
    this.voiceService = new VoiceService();
    this.audiofileService = new AudiofileService();
    this.usageRecordService = new UsageRecordService();
    this.organizationService = new OrganizationService();
    this.languageService = new LanguageService();
  }

  /**
   * Method to make sure the logged-in user is the owner of the Publication.
   */
  public restrictResourceToOwner = async (req: Request, res: PublicationResponse, next: NextFunction) => {
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

    res.locals.publication = publication;

    return next()
  }

  /**
   * @swagger
   *
   *  /publications:
   *    get:
   *      operationId: getAllPublications
   *      tags:
   *        - publications
   *      summary: Get the Publications the user has access to.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: An array of Publication's
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/Publication'
   */
  public getAllPublications = async (req: GetAllPublicationsRequest, res: PublicationResponse): Promise<PublicationResponse> => {
    const userId = req.user!.id;
    const response = await this.publicationService.findAllPublicationsForUser(userId);

    return res.json(response);
  }

  /**
   * @swagger
   *
   *  /publications/{publicationId}:
   *    get:
   *      operationId: getOnePublication
   *      tags:
   *        - publications
   *      summary: Get a single Publication the user has access to.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: publicationId
   *          schema:
   *            type: string
   *          required: true
   *          description: The UUID of a Publication.
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: A publication object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/Publication'
   */
  public getOnePublication = async (req: GetOnePublicationRequest, res: PublicationResponse): Promise<PublicationResponse> => {
    const publicationOfUser = res.locals.publication;

    return res.json(publicationOfUser);
  }

  /**
   * @swagger
   *
   *  /publications/{publicationId}/articles:
   *    get:
   *      operationId: getAllPublicationArticleSummaries
   *      tags:
   *        - publications
   *      summary: Get all the Publication's Article summaries.
   *      description: Returns a summary of Article's. Not the complete article object.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: publicationId
   *          schema:
   *            type: string
   *          required: true
   *          description: The UUID of a Publication.
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        '200':
   *          $ref: '#/components/responses/ArticleSummariesResponse'
   */
  public getAllPublicationArticleSummaries = async (req: GetAllPublicationArticlesRequest, res: PublicationResponse): Promise<PublicationResponse> => {
    const { publicationId } = req.params;

    const requestQuery = this.validatePagingParams(req.query);
    const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    
    const where: FindManyOptions<Article> = {
      where: {
        publication: {
          id: publicationId
        }
      }
    }
    
    const articleSummariesResponse = await this.articleService.findAllSummariesCollection(where, page, perPage, skip, take);

    return res.json(articleSummariesResponse)
  }

  /**
   * @swagger
   *
   *  /publications/{publicationId}/articles/{articleId}:
   *    get:
   *      operationId: getOnePublicationArticle
   *      tags:
   *        - publications
   *      summary: Get a single article of a publication.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: publicationId
   *          schema:
   *            type: string
   *          required: true
   *          description: The UUID of a Publication.
   *        - in: path
   *          name: articleId
   *          schema:
   *            type: string
   *          required: true
   *          description: The UUID of a Article.
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: A complete Article object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/Article'
   */
  public getOnePublicationArticle = async (req: GetOnePublicationArticleRequest, res: PublicationResponse): Promise<PublicationResponse> => {
    const { publicationId, articleId } = req.params;

    const fullArticle = await this.articleService.findOneByIdFull(articleId, {
      where: {
        publication: {
          id: publicationId
        }
      },
    })

    return res.json(fullArticle)
  }

  /**
   * @swagger
   *
   *  /publications/{publicationId}/import/article:
   *    post:
   *      operationId: postOnePublicationImportArticle
   *      tags:
   *        - publications
   *      summary: Import an article in our database using a URL.
   *      description: 
   *        Inserts an article in our database using a URL. Our crawler will fetch the required article contents. 
   *        Article is stored as a "draft", so it's not publicaly available (yet).
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: publicationId
   *          schema:
   *            type: string
   *          required: true
   *          description: The UUID of a Publication.
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostImportArticleRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        409:
   *          $ref: '#/components/responses/ConflictError'
   *        200:
   *          description: A complete Article object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/Article'
   */
  public postOnePublicationImportArticle = async (req: PostOnePublicationImportArticleRequest, res: PublicationResponse): Promise<PublicationResponse> => {
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

    // Normalize the URL
    // IMPORTANT: the normalized URL could still be different than the canonicalUrl in the database
    // For this we'll do an extra check later in the updateArticleToFull() method, to ensure we don't get duplicates
    // By doing it this way, we keep this method very quick and responsive for our user
    const normalizedUrl = getNormalizedUrl(url);

    if (!normalizedUrl.startsWith('http')) {
      throw new HttpError(HttpStatus.BadRequest, 'The given URL is not a website URL. We currently only support websites.');
    }
    
    // It seems some users try to add youtube urls. Just prevent it.
    // if (normalizedUrl.match(/^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})?$)/)) {
    //   throw new HttpError(HttpStatus.BadRequest, 'Playpost does not support YouTube.');
    // }

    const publication = res.locals.publication;

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

    const fullArticle = await this.articleService.findOneByIdFull(savedArticle.id, {})

    return res.json(fullArticle);
  };

  /**
   * @swagger
   *
   *  /publications/{publicationId}/articles:
   *    post:
   *      operationId: postOnePublicationArticle
   *      tags:
   *        - publications
   *      summary: Creates an Article
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: publicationId
   *          schema:
   *            type: string
   *          required: true
   *          description: The UUID of a Publication.
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostOnePublicationArticleRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        409:
   *          $ref: '#/components/responses/ConflictError'
   *        201:
   *          description: A complete Article object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/Article'
   */
  public postOnePublicationArticle = async (req: PostOnePublicationArticleRequest, res: PublicationResponse): Promise<PublicationResponse> => {
    const { publicationId } = req.params;

    const validationSchema = joi.object().keys({
      title: joi.string().required(),
      url: joi.string().uri().required(),
      sourceName: joi.string().required(),
      authorName: joi.string().required(),
      ssml: joi.string().required(),
      status: joi.string().required(),

      language: joi.object().keys({
        id: joi.string().uuid().required()
      }).required(),
      
      // optional
      description: joi.string().optional(),
      canonicalUrl: joi.string().uri().optional(),
      imageUrl: joi.string().uri().optional(),
      html: joi.string().optional(), // TODO: let our app handle articles without HTML (link directly to url)
    });

    const userValidationResult = validationSchema.validate(req.body, {
      abortEarly: false // Return all error details
    });

    if (userValidationResult.error) {
      const firstError = userValidationResult.error.details[0];

      throw new HttpError(HttpStatus.BadRequest, firstError.message, userValidationResult.error.details);
    }

    const ssml = req.body.ssml ? req.body.ssml : null;
    const languageId = req.body.language ? req.body.language.id : null;

    if (!ssml) {
      throw new HttpError(HttpStatus.BadRequest, 'SSML not found in request body.');
    }

    if (!languageId) {
      throw new HttpError(HttpStatus.BadRequest, 'Language ID not found in request body.');
    }

    const language = await this.languageService.findOneById(languageId)

    if (!language) {
      throw new HttpError(HttpStatus.NotFound, `Language with ID ${languageId} not found.`);
    }

    // Generate basic HTML based on the SSML
    // This generally just keeps the <p>'s intact, and strips the rest
    const html = getHTMLFromSSML(ssml);

    // Strip tags from SSML, so we end up with only the text contents
    // And make sure there's a correct space between dots.
    const ssmlTextContents = getTextFromSSML(ssml)

    // Prefer to get the listening time instead of the reading time
    // As that makes more sense
    const possibleListeningTimeInSeconds = getPossibleListeningTimeInSeconds(ssmlTextContents, language.code);

    const description = trimTextAtWords(ssmlTextContents, 200);

    const articleToCreate = new Article();

    // Only add the updated properties
    Object.keys(req.body).map(property => {
      articleToCreate[property] = req.body[property];
    });

    articleToCreate.publication = {
      id: publicationId
    } as any;

    articleToCreate.readingTime = possibleListeningTimeInSeconds;
    articleToCreate.description = description;
    articleToCreate.html = html;

    const { id } = await this.articleService.save(articleToCreate);

    const article = await this.articleService.findOneById(id);

    return res.status(HttpStatus.Created).json(article);
  }

  /**
   * @swagger
   *
   *  /publications/{publicationId}/articles/{articleId}:
   *    delete:
   *      operationId: deleteOnePublicationArticle
   *      tags:
   *        - publications
   *      summary: Delete a single Article of a Publication.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: publicationId
   *          schema:
   *            type: string
   *          required: true
   *          description: The UUID of a Publication.
   *        - in: path
   *          name: articleId
   *          schema:
   *            type: string
   *          required: true
   *          description: The UUID of a Article.
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        204:
   *          description: An empty success response
   */
  public deleteOnePublicationArticle = async (req: DeleteOnePublicationArticleRequest, res: PublicationResponse): Promise<PublicationResponse> => {
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

  public postOnePublicationAudiofile = async (req: PostOnePublicationAudiofileRequest, res: PublicationResponse): Promise<PublicationResponse> => {
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

    return res.status(HttpStatus.Created).json(createdAudiofile)
  }

  /**
   * @swagger
   *
   *  /publications/{publicationId}/preview-ssml:
   *    post:
   *      operationId: postOnePublicationPreviewSSML
   *      tags:
   *        - publications
   *      summary: Generate a audio preview using SSML.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: publicationId
   *          schema:
   *            type: string
   *          required: true
   *          description: The UUID of a Publication.
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostOnePreviewArticleSSMLRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: A AudioPreview object
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/AudioPreview'
   */
  public postOnePublicationPreviewSSML = async (req: PostOnePublicationPreviewSSMLRequest, res: PublicationResponse): Promise<PublicationResponse> => {
    const { publicationId } = req.params;
    const { ssml, voice, article } = req.body;

    const validationSchema = joi.object().keys({
      // required
      publicationId: joi.string().uuid().required(),
      voice: joi.object({
        id: joi.string().uuid().optional(),
      }).required(),
      ssml: joi.string().required(),

      // optional
      article: joi.object({
        id: joi.string().uuid().optional(),
      }).optional()
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
      const errorMessage = 'Paragraph length is too long to be previewed. Please break it up in smaller parts to preview this.';
      Sentry.captureMessage(errorMessage, Sentry.Severity.Critical);
      throw new HttpError(HttpStatus.BadRequest, errorMessage)
    }

    if (article && article.id) {
      const foundArticle = await this.articleService.findOneById(article.id, {
        where: {
          publication: {
            id: publicationId
          }
        }
      });
  
      if (!foundArticle) {
        throw new HttpError(HttpStatus.NotFound, 'Article does not exist.');
      }
    }

    if (!voice || !voice.id) {
      throw new HttpError(HttpStatus.BadRequest, 'A voice ID in the request body is required.');
    }
  
    const foundVoice = await this.voiceService.findOneByIdWhereActive(voice.id);

    if (!foundVoice) {
      throw new HttpError(HttpStatus.NotFound, 'Active voice does not exist.')
    }

    const synthesizerService = new SynthesizerService(foundVoice.synthesizer);

    // TODO: track preview characters

    const audioBase64String = await synthesizerService.preview({
      outputFormat: 'mp3',
      ssml,
      voiceLanguageCode: foundVoice.languageCode,
      voiceName: foundVoice.name,
      voiceSsmlGender: foundVoice.gender
    });

    const response: AudioPreview = {
      audio: audioBase64String
    }
    return res.status(HttpStatus.Created).json(response)
  }

  /**
   * @swagger
   *
   *  /publications/{publicationId}/articles/{articleId}:
   *    patch:
   *      operationId: patchOnePublicationArticle
   *      tags:
   *        - publications
   *      summary: Patches one article.
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: publicationId
   *          schema:
   *            type: string
   *          required: true
   *          description: The UUID of a Publication.
   *        - in: path
   *          name: articleId
   *          schema:
   *            type: string
   *          required: true
   *          description: The UUID of a Article.
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PatchOnePublicationArticleRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        204:
   *          description: An empty success response
   */
  public patchOnePublicationArticle = async (req: PatchOnePublicationArticleRequest, res: PublicationResponse): Promise<PublicationResponse> => {
    const { articleId, publicationId } = req.params;
    const requestBody = req.body;

    // Same as POST endpoint, but all properties are optional here
    const validationSchema = joi.object().keys({
      title: joi.string().optional(),
      description: joi.string().optional(),
      url: joi.string().uri().optional(),
      sourceName: joi.string().optional(),
      ssml: joi.string().optional(),
      status: joi.string().valid('draft', 'finished').lowercase().optional(),

      language: joi.object().keys({
        id: joi.string().uuid().required()
      }).optional(),
      
      // optional
      canonicalUrl: joi.string().uri().optional(),
      imageUrl: joi.string().uri().optional(),
      authorName: joi.string().optional(),
      html: joi.string().optional(), // TODO: let our app handle articles without HTML (link directly to url)
    });

    const userValidationResult = validationSchema.validate(requestBody, {
      allowUnknown: false // Do not allow other properties to be updated
    });

    if (userValidationResult.error) {
      const firstError = userValidationResult.error.details[0];
      throw new HttpError(HttpStatus.BadRequest, firstError.message, userValidationResult.error.details);
    }

    if (!Object.keys(requestBody).length) {
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
    Object.keys(requestBody).map(property => {
      updatedArticleProperties[property] = requestBody[property];
    });

    // TODO: if html/ssml changes, also create a new audiofile?

    await this.articleService.update(articleId, updatedArticleProperties);

    // Send no content, make the API consumer request the Article using the article endpoint
    // So we can leverage proper caching
    return res.status(HttpStatus.NoContent).send()

  }
}
