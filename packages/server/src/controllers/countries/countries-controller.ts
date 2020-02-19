import { Request, Response } from 'express';
import { CountryService } from '../../services/country-service';
import { BaseController } from '../index';

export class CountriesController extends BaseController {
  countryService: CountryService;

  constructor() {
    super()
    this.countryService = new CountryService();
  }

  /**
   * @swagger
   *
   *  /countries:
   *    get:
   *      operationId: getAllCountries
   *      tags:
   *        - countries
   *      summary: Get all countries
   *      security:
   *        - BearerAuth: []
   *        - ApiKeyAuth: []
   *          ApiSecretAuth: []
   *      responses:
   *        '400':
   *          $ref: '#/components/responses/BadRequestError'
   *        '401':
   *          $ref: '#/components/responses/UnauthorizedError'
   *        '404':
   *          $ref: '#/components/responses/NotFoundError'
   *        '200':
   *          $ref: '#/components/responses/CountriesResponse'
   */
  getAllCountries = async (req: Request, res: Response): Promise<Response> => {
    // Get all countries
    const countriesCollection = await this.countryService.findAll(1, 999, 0, 999);

    return res.json(countriesCollection);
  };

}
