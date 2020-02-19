import joi from '@hapi/joi';
import { HttpError, HttpStatus } from '../http-error';
import { CollectionRequestQuery } from '../typings';

export class BaseController {
  defaultPage: number;
  defaultPerPage: number;

  constructor () {
    this.defaultPage = 1;
    this.defaultPerPage = 20;
  }

  getPagingParams(requestQuery: CollectionRequestQuery) {
    const pageParam = parseInt(requestQuery.page, 10) || this.defaultPage;
    const perPageParam = parseInt(requestQuery.perPage, 10) || this.defaultPerPage;
    const skip = (pageParam * perPageParam) - perPageParam;
    const take = perPageParam;

    return {
      page: pageParam,
      perPage: perPageParam,
      skip,
      take
    }
  }

  validatePagingParams(requestQuery: CollectionRequestQuery) {
    const validationSchema = joi.object().keys({
      page: joi.number().integer().optional(),
      perPage: joi.number().integer().optional()
    })

    const { error } = validationSchema.validate(requestQuery);

    if (error) {
      throw new HttpError(HttpStatus.BadRequest, error.details[0].message, error.details[0]);
    }

    return requestQuery
  }
}
