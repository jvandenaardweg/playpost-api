import { Request, Response } from 'express';
import { CountryService } from '../../services/country-service';
import { BaseController } from '../index';

export class CountriesController extends BaseController {
  countryService: CountryService;

  constructor() {
    super()
    this.countryService = new CountryService();
  }

  getAll = async (req: Request, res: Response): Promise<Response> => {
    // Get all countries
    const countriesCollection = await this.countryService.findAll(1, 999, 0, 999);

    return res.json(countriesCollection);
  };

}
