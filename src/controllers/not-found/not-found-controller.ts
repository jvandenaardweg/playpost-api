import { Request, Response } from 'express';

import { BaseController } from '../index';

export class NotFoundController extends BaseController {
  constructor() {
    super()
  }

  getAll = (req: Request, res: Response) => {
    return res.status(404).json({ message: `No route found for ${req.method} ${req.url}` });
  }
}
