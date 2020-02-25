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
   *      responses:
   *        '400':
   *          $ref: '#/components/responses/BadRequestError'
   *        '401':
   *          $ref: '#/components/responses/UnauthorizedError'
   *        '404':
   *          $ref: '#/components/responses/NotFoundError'
   *        200:
   *          description: An array of Languages
   *          content:
   *            'application/json':
   *              schema:
   *                type: array
   *                items:
   *                  $ref: '#/components/schemas/Country'
   */
  getAllCountries = async (req: Request, res: Response): Promise<Response> => {
    // Get all countries
    const countries = await this.countryService.findAll();

    return res.json(countries);
  };

}
