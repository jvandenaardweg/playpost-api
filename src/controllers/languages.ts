import { Request, Response } from 'express';
import { FindConditions, getRepository } from 'typeorm';

import { Language } from '../database/entities/language';

import { CACHE_ONE_DAY } from '../constants/cache';

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
 *        '200':
 *          $ref: '#/components/responses/LanguagesResponse'
 */
export const getAll = async (req: Request, res: Response) => {
  const languageRepository = getRepository(Language);
  const { isActive }: {isActive: string } = req.query;

  const where: FindConditions<Language> = {}

  if (isActive) {
    where.isActive = isActive === 'true' ? true : isActive === 'false' ? false : undefined
  }

  const cacheKey = JSON.stringify(where);

  const languages = await languageRepository.find({
    where,
    relations: ['voices'],
    cache: {
      id: `${Language.name}:${cacheKey}`,
      milliseconds: CACHE_ONE_DAY
    }
  });

  return res.json(languages);
};

