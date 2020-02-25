import { Request, Response } from 'express';
import { FindConditions } from 'typeorm';

import { Language } from '../../database/entities/language';
import { BaseController } from '../index';
import { LanguageService } from '../../services/language-service';

export class LanguagesController extends BaseController {
  private readonly languageService: LanguageService;

  constructor() {
    super()
    this.languageService = new LanguageService();
  }

  /**
   * @swagger
   *
   *  /languages:
   *    get:
   *      operationId: getAllLanguages
   *      tags:
   *        - languages
   *      summary: Get all languages
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      responses:
   *        '400':
   *          $ref: '#/components/responses/BadRequestError'
   *        '401':
   *          $ref: '#/components/responses/UnauthorizedError'
   *        '404':
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: An array of Languages
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/Language'
   */
  getAllLanguages = async (req: Request, res: Response): Promise<Response> => {
    const { isActive }: {isActive: string } = req.query;

    const where: FindConditions<Language> = {}

    if (isActive) {
      where.isActive = isActive === 'true' ? true : isActive === 'false' ? false : undefined
    }

    const languages = await this.languageService.findAll({
      where
    });

    return res.json(languages);
  };

}
