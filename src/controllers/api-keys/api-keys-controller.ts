import { Request, Response } from 'express';
import joi from '@hapi/joi';

import { BaseController } from '../index';
import { HttpError, HttpStatus } from '../../http-error';
import { ApiKeysService } from '../../services/api-keys-service';
import { ApiKey } from '../../database/entities/api-key';
import { PostOneApiKeyRequestBody } from './types';

export class ApiKeysController extends BaseController {
  readonly apiKeysService: ApiKeysService;
  readonly apiKeyEntity: typeof ApiKey

  constructor() {
    super()
    this.apiKeysService = new ApiKeysService();
    this.apiKeyEntity = ApiKey;
  }

  /**
   * @swagger
   *
   *  /api-keys:
   *    get:
   *      operationId: getAllApiKeys
   *      tags:
   *        - api-keys
   *      summary: Get the user's API Key's
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
   *          description: An array of API Key's
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/ApiKey'
   */
  public getAllApiKeys = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const userKeys = await this.apiKeysService.findAllByUserId(userId)

    return res.json(userKeys);
  };

  /**
   * @swagger
   *
   *  /api-keys/{apiKeyId}:
   *    delete:
   *      operationId: deleteOneApiKey
   *      tags:
   *        - api-keys
   *      summary: Deletes a API key
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: apiKeyId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of a API Key
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
  public deleteOneApiKey = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { apiKeyId } = req.params;

    const validationSchema = joi.object().keys({
      apiKeyId: joi.string().uuid().required()
    });

    const { error } = validationSchema.validate(req.params);

    if (error) {
      const messageDetails = error.details.map(detail => detail.message).join(' and ');
      throw new HttpError(HttpStatus.BadRequest, messageDetails, error.details);
    }

    // Verify if the user has access to that key
    const existingKey = await this.apiKeysService.findOneByIdWithUserId(apiKeyId, userId);

    if (!existingKey) {
      throw new HttpError(HttpStatus.BadRequest, 'API key could not be found, or you do not have access to use this API key.')
    }

    await this.apiKeysService.deleteOne(existingKey);

    return res.status(HttpStatus.NoContent).send();
  };

  /**
   * @swagger
   *
   *  /api-keys:
   *    post:
   *      operationId: postOneApiKey
   *      tags:
   *        - api-keys
   *      summary: Creates an API Key for the user
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostOneApiKeyRequestBody'
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: One API Key
   *          content:
   *            'application/json':
   *              schema:
   *                $ref: '#/components/schemas/ApiKey'
   */
  postOneApiKey = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { label, allowedDomain } = req.body as PostOneApiKeyRequestBody;

    const validationSchema = joi.object().keys({
      label: joi.string().required(),
      allowedDomain: joi.string().optional()
    });

    const { error } = validationSchema.validate(req.body);

    if (error) {
      const messageDetails = error.details.map(detail => detail.message).join(' and ');
      throw new HttpError(HttpStatus.BadRequest, messageDetails, error.details);
    }

    // IMPORTANT: Only show this "apiKey" and "apiSecret" to the user ONCE
    const apiKey = this.apiKeyEntity.generateApiKey();
    const apiSecret = this.apiKeyEntity.generateApiSecret();

    // Store the signature in our database, so we can compare the user's API Key and API Secret when they send it to our server
    const signature = this.apiKeyEntity.generateApiKeySignature(apiKey, apiSecret);

    const normalizedAllowedDomain = allowedDomain ? allowedDomain.toLowerCase() : undefined;

    const newApiKey = new ApiKey();

    newApiKey.key = apiKey;
    newApiKey.signature = signature;
    newApiKey.allowedDomain = normalizedAllowedDomain;
    newApiKey.label = label;
    newApiKey.user.id = userId;

    const createdApiKey = await this.apiKeysService.createOne(newApiKey);

    return res.json(createdApiKey);
  };
}
