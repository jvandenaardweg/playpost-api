import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStatic } from 'passport';
// const { prisma } = require('../generated/prisma-client');

const { JWT_SECRET } = process.env;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

module.exports = (passport: PassportStatic) => {
  return passport.use(
    new Strategy(opts, (payload, done) => {

      const { id, email } = payload;

      // Send make the id and email available using "req.user.id" and "req.user.email"
      if (id && email) return done(null, { id, email });

      return done(null, false);
      // Get the user from the database
      // payload.id is extracted from the JWT token
      // return prisma.user({ id: payload.id })
      //   .then((user) => {
      //     if (!user) return done(null, false);

      //     // Never return the password
      //     const userWithoutPassword = user;
      //     delete userWithoutPassword.password;

      //     return done(null, userWithoutPassword);
      //   })
      //   .catch(err => console.error(err));
    })
  );
};
