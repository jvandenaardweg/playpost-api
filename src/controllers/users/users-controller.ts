import joi from '@hapi/joi';
import { Request, Response } from 'express';

import { HttpError, HttpStatus } from '../../http-error';
import { UserService } from '../../services/user-service';
import { BaseController } from '../index';
import { PostUsersRequestBody } from './types';

export class UsersController extends BaseController {
  usersService: UserService;

  constructor() {
    super();
    this.usersService = new UserService();
  }

  /**
   * @swagger
   *
   *  /users:
   *    post:
   *      operationId: postUsers
   *      tags:
   *        - users
   *      summary: Create a User
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/PostUsersRequestBody'
   *      responses:
   *        '400':
   *          $ref: '#/components/responses/BadRequestError'
   *        '401':
   *          $ref: '#/components/responses/UnauthorizedError'
   *        '404':
   *          $ref: '#/components/responses/NotFoundError'
   *        '200':
   *          $ref: '#/components/responses/PostUsersResponse'
   */
  postUsers = async (req: Request, res: Response) => {
    const { email, password } = req.body as PostUsersRequestBody;

    const validationSchema = joi.object().keys({
      email: joi.string().email({ minDomainSegments: 2 }),
      password: joi.string().min(6)
    });

    const userValidationResult = validationSchema.validate(req.body);

    if (userValidationResult.error) {
      const firstError = userValidationResult.error.details[0];

      throw new HttpError(HttpStatus.BadRequest, firstError.message, userValidationResult.error.details);
    }

    await this.usersService.createOne(email, password);

    // Get the user and return it
    // Our App needs this user info
    const user = await this.usersService.findOneByEmail(email)

    return res.json(user);
  }
}
