import CustomPassportStrategy from 'passport-custom';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getRepository } from 'typeorm';
import * as cacheKeys from '../cache/keys';
import { ApiKey } from '../database/entities/api-key';
import { User } from '../database/entities/user';
import { getRealUserIpAddress } from '../utils/ip-address';

const { JWT_SECRET } = process.env;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

interface IStrategyPayload {
  id: string,
  email: string
}

export const jwtPassportStrategy = new Strategy(opts, async (payload: IStrategyPayload, done) => {
  if (!payload) {
    return done(null, false, 'Token not valid.');
  }

  // id available in payload
  const { id } = payload;

  // Verify if the user still exists
  // We'll cache this result for 24 hours,
  // resulting in faster API responses the next time the user does a request
  const user = await getRepository(User).findOne(id, {
    cache: {
      id: cacheKeys.jwtVerifyUser(id),
      milliseconds: (24 * 3600000) // cache 24 hours
    },
    loadEagerRelations: false
  });

  if (!user) { return done(null, false, 'User not found.'); }

  return done(null, { id: user.id, email: user.email });

});

/**
 * Strategy to authenticate a user using an API Key and API Secret.
 * User's can create an API Key and API Secret using the API when they are logged in using their e-mail and password.
 */
export const apiKeySecretPassportStrategy = new CustomPassportStrategy(async (req, done) => {

  const apiKey = req.headers['x-api-key'];
  const apiSecret = req.headers['x-api-secret'];
  const lastUsedIpAddress = getRealUserIpAddress(req);

  if (!apiKey) {
    return done(null, false, 'No X-Api-Key found in header.');
  }

  if (!apiSecret) {
    return done(null, false, 'No X-Api-Secret found in header.');
  }

  const existingApiKey = await getRepository(ApiKey).findOne({
    where: {
      key: apiKey,
    },
    select: ['id', 'key', 'signature', 'user'], // Manually select the columns we need, since "signature" is not included by default
    relations: ['user'],
    cache: {
      id: cacheKeys.apiKeyUser(apiKey),
      milliseconds: (24 * 3600000) // cache 24 hours
    },
  });

  if (!existingApiKey) {
    return done(null, false, 'API key does not exist.');
  }

  // Validate the signature using the given API Key and API Secret
  const isValidSignature = ApiKey.isValidSignature(apiKey, apiSecret, existingApiKey.signature);

  if (!isValidSignature) {
    return done(null, false, 'The given API Key and API Secret do not match the signature. Either the API Key or API Secret is invalid.');
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
