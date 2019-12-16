import { NextFunction, Request, Response } from 'express';

export class BaseController {
  handleError(err: any, res: Response) {
    const errStatus = err.status ? err.status : 400;

    return res.status(errStatus).json({
      message: err.message,
      details: err.details ? err.details : undefined
    });
  }
}
