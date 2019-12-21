import { getConnection } from 'typeorm';

import { Language } from '../database/entities/language';
import { BaseService } from './index';

export class LanguageService extends BaseService {
  constructor () {
    super()
  }

  public findOneByCode = async (languageCode: string): Promise<Language | undefined> => {
    const language = await getConnection()
      .getRepository(Language)
      .createQueryBuilder('language')
      .where('language.code = :languageCode', { languageCode })
      .getOne()

    return language;
  }

  public findOneActiveByCode = async (languageCode: string): Promise<Language | undefined> => {
    const language = await getConnection()
      .getRepository(Language)
      .createQueryBuilder('language')
      .where('language.code = :languageCode', { languageCode })
      .where('language.isActive = :isActive', { isActive: true })
      .getOne()

    return language;
  }
}
