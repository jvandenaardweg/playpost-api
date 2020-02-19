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
    const { email, password, organization } = req.body as PostUsersRequestBody;

    const validationSchema = joi.object().keys({
      email: joi.string().email({ minDomainSegments: 2 }),
      password: joi.string().min(6),
      organization: joi.object().optional()
    });

    const userValidationResult = validationSchema.validate(req.body);

    if (userValidationResult.error) {
      const firstError = userValidationResult.error.details[0];

      throw new HttpError(HttpStatus.BadRequest, firstError.message, userValidationResult.error.details);
    }

    if (organization) {
      const organizationValidationSchema = joi.object().keys({
        organization: joi.object().keys({
          name: joi
            .string()
            .max(50)
            .required()
            .messages({
              'string.base': 'Organization name must be a string.',
              'string.empty': 'Organization name cannot be empty.',
              'string.max': 'Organization name should have a maximum length of {#limit}.',
              'any.required': 'An organization name is required.'
            })
        })
      });

      // Only validate the organization object, remove email and password
      const organizationBody = { organization: req.body.organization };
      const organizationValidation = organizationValidationSchema.validate(organizationBody);

      if (organizationValidation.error) {
        const firstErrorMessage = organizationValidation.error.details[0].message;

        throw new HttpError(HttpStatus.BadRequest, firstErrorMessage, organizationValidation.error.details);
      }
    }

    await this.usersService.create(email, password, organization);

    // Get the user and return it
    // Our App needs this user info
    const user = await this.usersService.findOneByEmail(email)

    return res.json(user);
  }
}