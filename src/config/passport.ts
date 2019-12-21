import passportCustom from 'passport-custom';
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { getCustomRepository, getRepository } from 'typeorm';
import * as cacheKeys from '../cache/keys';
import { CACHE_ONE_DAY } from '../constants/cache';
import { ApiKey } from '../database/entities/api-key';
import { User } from '../database/entities/user';
import { UserRepository } from '../database/repositories/user';
import { getRealUserIpAddress } from '../utils/ip-address';
import { HttpError, HttpStatus } from '../http-error';

const { JWT_SECRET } = process.env;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

interface IStrategyPayload {
  id: string,
  email: string
}

export const jwtPassportStrategy = new Strategy(opts, async (payload: IStrategyPayload, done: VerifiedCallback) => {
  if (!payload) {
    return done(new Error('An error happened while authenticating. The provided authentication token is not valid.'));
  }

  // id available in payload
  const { id } = payload;

  // Verify if the user still exists
  // We'll cache this result for 24 hours,
  // resulting in faster API responses the next time the user does a request
  // We only select a few columns we need
  const user = await getRepository(User).findOne(id, {
    select: ['id', 'email'],
    cache: {
      id: cacheKeys.jwtVerifyUser(id),
      milliseconds: CACHE_ONE_DAY
    },
    loadEagerRelations: false
  });

  if (!user) {
    // Make sure the previously create caches are removed
    await getCustomRepository(UserRepository).removeUserRelatedCaches(id);

    return done(new Error('An error happened while authenticating. The user could not be found.'));
  }

  return done(null, { id: user.id, email: user.email });

});

/**
 * Strategy to authenticate a user using an API Key and API Secret.
 * User's can create an API Key and API Secret using the API when they are logged in using their e-mail and password.
 */
export const apiKeySecretPassportStrategy = new passportCustom.Strategy(async (req, done) => {
  const authHeader = req.headers['authorization'] as string | undefined;

  // If we find the auth headers if we end up in this strategy, just return unauthorized
  // User must return ONLY "x-api-key" and "x-api-secret"
  if (authHeader) {
    return done(new HttpError(HttpStatus.Unauthorized, 'You are not logged in or your access is expired. Please login and try again.'))
  }

  const apiKey  = req.headers['x-api-key'] as string | undefined;
  const apiSecret = req.headers['x-api-secret'] as string | undefined;
  const lastUsedIpAddress = getRealUserIpAddress(req);

  if (!apiKey) {
    return done(new Error('An error happened while authenticating. No X-Api-Key found in header.'));
  }

  if (!apiSecret) {
    return done(new Error('An error happened while authenticating. No X-Api-Secret found in header.'));
  }

  const existingApiKey = await getRepository(ApiKey).findOne({
    where: {
      key: apiKey,
    },
    select: ['id', 'key', 'signature', 'user'], // Manually select the columns we need, since "signature" is not included by default
    relations: ['user'],
    cache: {
      id: cacheKeys.apiKeyUser(apiKey),
      milliseconds: CACHE_ONE_DAY // cache 24 hours
    },
  });

  if (!existingApiKey) {
    return done(new Error('An error happened while authenticating. The API Key does not exist.'), false);
  }

  // Validate the signature using the given API Key and API Secret
  const isValidSignature = ApiKey.isValidSignature(apiKey, apiSecret, existingApiKey.signature);

  if (!isValidSignature) {
    return done(new Error('An error happened while authenticating. The given API Key and API Secret do not match the signature. Either the API Key or API Secret is invalid.'), false);
  }

  // Update usage for security purposes
  // So the user can decide if their key is compromised, or not, and act upon that
  await getRepository(ApiKey).update(existingApiKey, {
    lastUsedAt: new Date(),
    lastUsedIpAddress
  })

  // Signature is valid, set the user as authenticated
  return done(null, { id: existingApiKey.user.id, email: existingApiKey.user.email });

});
