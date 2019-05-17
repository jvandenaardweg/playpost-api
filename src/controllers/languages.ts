import { Request, Response } from 'express';
import { getRepository } from 'typeorm';

import { Language } from '../database/entities/language';

import { CACHE_ONE_DAY } from '../constants/cache';

export const findAll = async (req: Request, res: Response) => {
  const languageRepository = getRepository(Language);

  const languages = await languageRepository.find({
    relations: ['voices']
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
      id: 'languages_active',
      milliseconds: CACHE_ONE_DAY
    }
  });

  // const activeLanguages = await languageRepository
  //   .createQueryBuilder('language')
  //   .leftJoinAndSelect('language.voices', 'voice')
  //     .where('language.isActive = :isActive', { isActive: true })
  //       .andWhere('voice.isActive = :isActive', { isActive: true })
  //   .cache('languages_active', CACHE_ONE_DAY)
  //   .getMany();

  return res.json(activeLanguages);
};
