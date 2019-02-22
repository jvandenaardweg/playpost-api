require('dotenv').config();
const { Strategy, ExtractJwt } = require('passport-jwt');
// const { prisma } = require('../../generated/prisma-client');

const { JWT_SECRET } = process.env;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

module.exports = (passport) => {
  return passport.use(
    new Strategy(opts, (payload, done) => {

      const user = payload;
      if (payload.id) return done(null, user);

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
