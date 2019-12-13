
import { NextFunction, Request, Response } from 'express';
import { getRepository, Repository } from 'typeorm';
import { User } from '../../database/entities/user';

export class UserController {
  userRepository: Repository<User>;

  constructor() {
    this.userRepository = getRepository(User);
  }

  restrictResourceToOwner = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;

    const user = await this.userRepository.findOne(userId);

    if (!user) {
      return res.status(404).json({ message: 'User could not be not found.' });
    }

    if (userId !== user.id) {
      return res.status(403).json({ message: 'You have no access to view this user.' });
    }

    return next()
  }

  getUser = async (req: Request, res: Response) => {
    const userId = req.user.id;

    const user = await this.userRepository.findOne(userId)

    return res.json(user)
  }
}
