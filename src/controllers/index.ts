import { Response } from 'express';
import joi from 'joi';
import { CollectionRequestQuery } from '../typings';

export class BaseController {
  defaultPage: number;
  defaultPerPage: number;

  constructor () {
    this.defaultPage = 1;
    this.defaultPerPage = 20;
  }

  handleError(err: any, res: Response) {
    const errStatus = err.status ? err.status : 400;

    return res.status(errStatus).json({
      message: err.message,
      details: err.details ? err.details : undefined
    });
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
    const validationSchemaRequestQuery = joi.object().keys({
      page: joi.number().integer(),
      perPage: joi.number().integer()
    })

    const { error } = joi.validate(requestQuery, validationSchemaRequestQuery);

    if (error) {
      throw {
        status: 400,
        message: error.details[0].message,
        details: error.details[0]
      }
    }

    return requestQuery
  }
}
