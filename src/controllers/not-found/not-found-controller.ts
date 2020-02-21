import { Request, Response } from 'express';

import { BaseController } from '../index';
import { HttpError, HttpStatus } from '../../http-error';

export class NotFoundController extends BaseController {
  constructor() {
    super()
  }

  public getAllNotFound = (req: Request, res: Response) => {
    throw new HttpError(HttpStatus.NotFound, `No route found for ${req.method} ${req.url}`);
  }
}
