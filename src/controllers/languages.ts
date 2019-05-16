import { Request, Response } from 'express';
import { getRepository } from 'typeorm';

import { Language } from '../database/entities/language';

export const findAll = async (req: Request, res: Response) => {
  const languageRepository = getRepository(Language);

  const languages = await languageRepository.find({
    relations: ['voices']
  });

  return res.json(languages);
};

export const findAllActive = async (req: Request, res: Response) => {
  const languageRepository = getRepository(Language);

  const activeLanguages = await languageRepository.find({
    relations: ['voices'],
    where: {
      isActive: true,
    }
  });

  return res.json(activeLanguages);
};
