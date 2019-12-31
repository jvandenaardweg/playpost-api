import { getRepository, Repository } from 'typeorm';

import { Language } from '../database/entities/language';
import { BaseService } from './index';

export class LanguageService extends BaseService {
  private readonly languageRepository: Repository<Language>;

  constructor () {
    super()

    this.languageRepository = getRepository(Language);
  }

  public findOneByCode = async (languageCode: string): Promise<Language | undefined> => {
    const language = await this.languageRepository
      .createQueryBuilder('language')
      .where('language.code = :languageCode', { languageCode })
      .getOne()

    return language;
  }

  public findOneActiveByCode = async (languageCode: string): Promise<Language | undefined> => {
    const language = await this.languageRepository
      .createQueryBuilder('language')
      .where('language.code = :languageCode', { languageCode })
      .where('language.isActive = :isActive', { isActive: true })
      .getOne()

    return language;
  }
}
