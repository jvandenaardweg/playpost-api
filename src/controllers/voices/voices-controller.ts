import { Request, Response } from 'express';
import { getRepository, FindConditions, getCustomRepository } from 'typeorm';
import joi from '@hapi/joi';

import { BaseController } from '../index';
import { Voice } from '../../database/entities/voice';
import { VoiceRepository } from '../../database/repositories/voice';
import * as storage from '../../storage/google-cloud';
import { HttpStatus, HttpError } from '../../http-error';
import { VoiceService } from '../../services/voice-service';

export class VoicesController extends BaseController {
  private readonly voiceService: VoiceService;

  constructor() {
    super()
    this.voiceService = new VoiceService();
  }

  /**
   * @swagger
   *
   *  /voices:
   *    get:
   *      operationId: getAllVoices
   *      tags:
   *        - voices
   *      summary: Get all voices
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
   *          description: An array of Voice's
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/Voice'
   */
  public getAllVoices = async (req: Request, res: Response): Promise<Response> => {
    const { isActive }: {isActive: string } = req.query;

    const where: FindConditions<Voice> = {}

    if (isActive) {
      where.isActive = isActive === 'true' ? true : isActive === 'false' ? false : undefined
    }

    const voices = await this.voiceService.findAll({
      where
    });

    return res.json(voices);
  };

  /**
   * @swagger
   *
   *  /voices/{voiceId}/preview:
   *    post:
   *      operationId: postOneVoicePreview
   *      tags:
   *        - voices
   *      summary: Creates a Voice preview
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: voiceId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of a Voice
   *      responses:
   *        400:
   *          $ref: '#/components/responses/BadRequestError'
   *        401:
   *          $ref: '#/components/responses/UnauthorizedError'
   *        404:
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: The Voice with the new preview in it
   *          content:
   *            'application/json':
   *              schema:
   *                type: object
   *                $ref: '#/components/schemas/Voice'
   */
  public postOneVoicePreview = async (req: Request, res: Response) => {
    const { voiceId } = req.params;
  
    const voiceRepository = getCustomRepository(VoiceRepository);
  
    const updatedVoice = await voiceRepository.createVoicePreview(voiceId);
  
    return res.status(HttpStatus.Created).json(updatedVoice);
  };
  
  /**
   * @swagger
   *
   *  /voices/{voiceId}/preview:
   *    delete:
   *      operationId: deleteOneVoicePreview
   *      tags:
   *        - voices
   *      summary: Deletes a Voice preview
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      parameters:
   *        - in: path
   *          name: voiceId
   *          schema:
   *            type: string
   *          required: true
   *          description: A UUID of a Voice
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
  public deleteOneVoicePreview = async (req: Request, res: Response) => {
    const userEmail = req.user!.email;
    const { voiceId } = req.params;
    const voiceRepository = getRepository(Voice);
  
    if (userEmail !== 'jordyvandenaardweg@gmail.com') { 
      throw new HttpError(HttpStatus.Forbidden, 'You dont have access to this endpoint.')
    }
  
    const validationSchema = joi.object().keys({
      id: joi.string().uuid().required(),
      voiceId: joi.string().uuid().required()
    });
  
    const { error } = validationSchema.validate(req.params);
  
    if (error) {
      const messageDetails = error.details.map(detail => detail.message).join(' and ');
      throw new HttpError(HttpStatus.BadRequest, messageDetails, error.details)
    }
  
    const voice = await voiceRepository.findOne(voiceId);
  
    if (!voice) { 
      throw new HttpError(HttpStatus.NotFound, 'Voice not found!')
    }
  
    if (!voice.exampleAudioUrl) { 
      throw new HttpError(HttpStatus.BadRequest, 'This voice has no voice preview. Nothing to be deleted!')
    }
  
    // Delete the URL from the voice in the database
    await voiceRepository.update(voiceId, {
      exampleAudioUrl: undefined
    });
  
    // Dlete the file from our storage
    await storage.deleteVoicePreview(voiceId);
  
    return res.status(HttpStatus.NoContent).send();
  };

}
