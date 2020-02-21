import { Request, Response } from 'express';

import { BaseController } from '../index';
import { HttpStatus } from '../../http-error';

export class StatusController extends BaseController {
  constructor() {
    super()
  }

  getAll = (req: Request, res: Response) => {
    return res.status(HttpStatus.OK).json({ message: 'OK' });
  }
}
