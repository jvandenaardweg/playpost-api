import { validate, ValidationError } from 'class-validator';

/**
 * Validates an object against an entity. So we can show a proper error message to the end user if a validation fails.
 * @param entity An entity class
 * @param fields An object with key value pairs, like: { email: "test@test.com", password: "demo" }
 * @returns { errors: [], message: string }
 */
export const validateInput = async (entity: any, fields: any) => {
  const entityToValidate = new entity();

  Object.keys(fields).forEach((fieldKey) => {
    entityToValidate[fieldKey] = fields[fieldKey];
  });

  const errors: ValidationError[] = await validate(entityToValidate, { skipMissingProperties: true, validationError: { target: false } });

  return {
    errors,
    message: 'Validation failed!'
  };
};
