import { Request, Response } from 'express';

import { BaseController } from '../index';

export class StatusController extends BaseController {
  constructor() {
    super()
  }

  getAll = (req: Request, res: Response) => {
    return res.status(200).json({ message: 'OK' });
  }
}
