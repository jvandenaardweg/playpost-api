import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStatic } from 'passport';
import { User } from '../database/entities/user';
import { getRepository } from 'typeorm';

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

      const { id } = payload;

      const user = await getRepository(User).findOne(id);

      if (!user) return done(null, false);

      return done(null, { id: user.id, email: user.email });

    })
  );
};
