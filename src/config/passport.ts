import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStatic } from 'passport';
import { User } from '../database/entities/user';
import { getRepository } from 'typeorm';
import * as cacheKeys from '../cache/keys';

const { JWT_SECRET } = process.env;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

type StrategyPayload = {
  id: string,
  email: string
};

module.exports = (passport: PassportStatic) => {
  return passport.use(
    new Strategy(opts, async (payload: StrategyPayload, done) => {

      if (!payload) return done(null, false, 'Token not valid.');

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

      if (!user) return done(null, false, 'User not found.');

      return done(null, { id: user.id, email: user.email });

    })
  );
};
