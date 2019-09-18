import { Request, Response } from 'express';
import { FindConditions, getRepository } from 'typeorm';

import { Language } from '../database/entities/language';

import { CACHE_ONE_DAY } from '../constants/cache';

export const findAll = async (req: Request, res: Response) => {
  const languageRepository = getRepository(Language);
  const { isActive }: {isActive: string } = req.query;

  const where: FindConditions<Language> = {}

  if (isActive) {
    where.isActive = isActive === 'true' ? true : isActive === 'false' ? false : undefined
  }

  const cacheKey = JSON.stringify(where);

  const languages = await languageRepository.find({
    relations: ['voices'],
    cache: {
      id: `${Language.name}:${cacheKey}`,
      milliseconds: CACHE_ONE_DAY
    }
  });

  return res.json(languages);
};

/**
 * Gets all the active languages including their active voices
 *
 */
export const findAllActive = async (req: Request, res: Response) => {
  const languageRepository = getRepository(Language);

  const activeLanguages = await languageRepository.find({
    relations: ['voices'],
    where: {
      isActive: true
    },
    cache: {
      id: `${Language.name}:active`,
      milliseconds: CACHE_ONE_DAY
    }
  });

  // const activeLanguages = await languageRepository
  //   .createQueryBuilder('language')
  //   .leftJoinAndSelect('language.voices', 'voice')
  //   .leftJoin('voice.language', 'user_voice_setting')
  //     .where('language.isActive = :isActive', { isActive: true })
  //       .andWhere('voice.isActive = :isActive', { isActive: true })
  //   // .cache('languages_active', CACHE_ONE_DAY)
  //   .getMany();

  return res.json(activeLanguages);
};
