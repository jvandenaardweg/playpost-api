import joi from 'joi';
import { CollectionRequestQuery } from '../typings';

export class BaseService {
  constructor () { }

  validateGetOneParam(requestParams: any): { organizationId: string } {
    const validationSchema = joi.object().keys({
      organizationId: joi.string().uuid().required()
    })

    const { error } = joi.validate(requestParams, validationSchema);

    if (error) {
      throw {
        status: 400,
        message: error.details[0].message,
        details: error.details[0]
      }
    }

    return {
      organizationId: requestParams.organizationId
    }
  }

  validateGetAllParams(requestQuery: CollectionRequestQuery) {
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

    const defaultPage = 1;
    const defaultPerPage = 10;

    const pageParam = parseInt(requestQuery.page, 10) || defaultPage;
    const perPageParam = parseInt(requestQuery.perPage, 10) || defaultPerPage;
    const skip = (pageParam * perPageParam) - perPageParam;
    const take = perPageParam;

    return {
      page: pageParam,
      perPage: perPageParam,
      skip,
      take
    }
  }
}
