import { Request, Response } from 'express';
import { getRepository } from 'typeorm';

import { Language } from '../database/entities/language';

import { CACHE_ONE_DAY } from '../constants/cache';

export const findAll = async (req: Request, res: Response) => {
  const languageRepository = getRepository(Language);
  const { isActive }: {isActive: string } = req.query;

  if (isActive === 'true') {
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

    return res.json(activeLanguages);
  }

  if (isActive === 'false') {
    const inactiveLanguages = await languageRepository.find({
      relations: ['voices'],
      where: {
        isActive: false
      },
      cache: {
        id: `${Language.name}:inactive`,
        milliseconds: CACHE_ONE_DAY
      }
    });

    return res.json(inactiveLanguages);
  }

  const allLanguages = await languageRepository.find({
    relations: ['voices'],
    cache: {
      id: `${Language.name}:all`,
      milliseconds: CACHE_ONE_DAY
    }
  });

  return res.json(allLanguages);



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
