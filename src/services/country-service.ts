import { getRepository, Repository } from 'typeorm';

import { BaseService } from './index';
import { Country } from '../database/entities/country';

export class CountryService extends BaseService {
  private readonly countryRepository: Repository<Country>;

  constructor () {
    super()
    this.countryRepository = getRepository(Country)
  }

  public findAll = async (): Promise<Country[]> => {
    return this.countryRepository.find({
      order: {
        name: 'ASC'
      }
    })
  }

  public findOneById = async (countryId: string): Promise<Country | undefined> => {
    return this.countryRepository.findOne(countryId)
  }

  public findOneByCountryCode = async (countryCode: string): Promise<Country | undefined> => {
    return this.countryRepository.findOne({
      where: {
        code: countryCode
      }
    })
  }
}
