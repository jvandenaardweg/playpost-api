
import { NextFunction, Request, Response } from 'express';

import { HttpError, HttpStatus } from '../../http-error';
import { UserService } from '../../services/user-service';
import { BaseController } from '../index';

export class UserController extends BaseController {
  private readonly usersService: UserService;

  constructor() {
    super();

    this.usersService = new UserService()
  }

  restrictResourceToOwner = async (req: Request, res: Response, next: NextFunction) => {
    const authenticatedUserId = req.user!.id;

    const user = await this.usersService.findOneById(authenticatedUserId);

    if (!user) {
      throw new HttpError(HttpStatus.NotFound, 'User could not be not found.');
    }

    if (authenticatedUserId !== user.id) {
      throw new HttpError(HttpStatus.Forbidden, 'You have no access to view this user.');
    }

    return next()
  }

  getUser = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const user = await this.usersService.findOneById(userId);

    return res.json(user)
  }
}
