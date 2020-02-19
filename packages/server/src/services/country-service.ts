import { getConnection } from 'typeorm';

import { BaseService } from './index';
import { Country } from '../database/entities/country';
import { CollectionResponse } from '../typings';
import { CACHE_FOREVER } from '../constants/cache';

export class CountryService extends BaseService {
  constructor () {
    super()
  }

  public findAll = async (page: number, perPage: number, skip: number, take: number): Promise<CollectionResponse<Country[]>> => {
    const [countries, total] = await getConnection()
      .getRepository(Country)
      .createQueryBuilder('country')
      .skip(skip)
      .take(take)
      .orderBy('country.name', 'ASC')
      .cache('Country:all', CACHE_FOREVER)
      .getManyAndCount()

    const totalPages = this.getTotalPages(total, perPage);

    const response: CollectionResponse<Country[]> = {
      total,
      page,
      perPage,
      totalPages,
      data: countries
    }

    return response;
  }
}
