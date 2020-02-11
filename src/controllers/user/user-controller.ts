
import { NextFunction, Request, Response } from 'express';
import joi from '@hapi/joi';

import { HttpError, HttpStatus } from '../../http-error';
import { UserService } from '../../services/user-service';
import { BaseController } from '../index';
import { UpdateUserRequesBody } from './types';
import { User } from '../../database/entities/user';
import { getConnection } from 'typeorm';
import * as cacheKeys from '../../cache/keys';

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

  updateUser = async (req: Request, res: Response) => {
    const { email, currentPassword, newPassword } = req.body as UpdateUserRequesBody;
    const userId = req.user!.id;

    const validationSchema = joi.object().keys({
      email: joi.string().email({ minDomainSegments: 2 }).optional(),
      currentPassword: joi.string().min(6).optional(),
      newPassword: joi.string().min(6).optional()
    });

    const userValidationResult = validationSchema.validate(req.body);

    if (userValidationResult.error) {
      const firstError = userValidationResult.error.details[0];

      throw new HttpError(HttpStatus.BadRequest, firstError.message, userValidationResult.error.details);
    }

    if (email) {
      // Update the user's e-mail address
      await this.usersService.updateEmail(userId, email);

      // Get the updated user info
      const user = await this.usersService.findOneById(userId)

      return res.json(user);
    }

    if (currentPassword && newPassword) {
      const userObjectWithPassword = await this.usersService.findOneByIdWithPassword(userId);

      if (!userObjectWithPassword) {
        throw new HttpError(HttpStatus.NotFound, 'User to update the password for is not found.');
      }

      // Compare the currentPassword with our password hash in the database
      // If they match, validation is true
      const validateCurrentPassword = await User.comparePassword(currentPassword, userObjectWithPassword.password);

      if (!validateCurrentPassword){
        throw new HttpError(HttpStatus.Forbidden, 'The given current password does not match with the password we already have. Are you sure you entered your current password correctly?');
      }
      
      // Checks passed, we can update the user's password

      await this.usersService.updatePassword(userId, newPassword);
  
      // Remove the JWT verification cache as the user updated data
      const cache = getConnection('default').queryResultCache;
      if (cache) { 
        await cache.remove([cacheKeys.jwtVerifyUser(userId)]); 
      }
  
      // Get the updated user info
      const user = await this.usersService.findOneById(userId)

      return res.json(user);
    }

    throw new HttpError(HttpStatus.BadRequest, 'You can only update your email or password.');    
  }
}
