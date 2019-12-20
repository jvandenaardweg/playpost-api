import joi from '@hapi/joi';
import { Request, Response } from 'express';

import { UsersService } from '../../services/usersService';
import { BaseController } from '../index';
import { CreateUserRequestBody } from './types';

export class UsersController extends BaseController {
  usersService: UsersService;

  constructor() {
    super();
    this.usersService = new UsersService();
  }

  create = async (req: Request, res: Response) => {
    const { email, password, organization } = req.body as CreateUserRequestBody;

    try {
      const validationSchema = joi.object().keys({
        email: joi.string().email({ minDomainSegments: 2 }),
        password: joi.string().min(6),
        organization: joi.object().optional()
      });

      const userValidationResult = validationSchema.validate(req.body);

      if (userValidationResult.error) {
        const firstError = userValidationResult.error.details[0];

        throw {
          status: 400,
          message: firstError.message,
          details: userValidationResult.error.details
        };
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

          throw {
            status: 400,
            message: firstErrorMessage,
            details: organizationValidation.error.details
          };
        }
      }

      await this.usersService.create(email, password, organization);

      return res.status(204).send();
    } catch (err) {
      return this.handleError(err, res);
    }
  }
}
