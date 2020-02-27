import { getRepository, Repository, FindManyOptions } from 'typeorm';

import { Language } from '../database/entities/language';
import { BaseService } from './index';
import { CACHE_ONE_DAY } from '../constants/cache';

export class LanguageService extends BaseService {
  private readonly languageRepository: Repository<Language>;
  private readonly defaultRelations: string[];

  constructor () {
    super()

    this.languageRepository = getRepository(Language);
    this.defaultRelations = ['voices']
  }

  public findOneById = async (languageId: string): Promise<Language | undefined> => {
    return this.languageRepository.findOne(languageId)
  }

  public findAll = async (options?: FindManyOptions<Language> | undefined) => {
    const cacheKey = options && options.where ? JSON.stringify(options.where) : 'all';

    const languages = await this.languageRepository.find({
      ...options,
      order: {
        name: 'ASC'
      },
      relations: this.defaultRelations,
      cache: {
        id: `${Language.name}:${cacheKey}`,
        milliseconds: CACHE_ONE_DAY
      }
    });

    return languages
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
