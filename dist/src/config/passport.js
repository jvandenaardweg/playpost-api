"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const passport_jwt_1 = require("passport-jwt");
// const { prisma } = require('../../generated/prisma-client');
const { JWT_SECRET } = process.env;
const opts = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
};
module.exports = (passport) => {
    return passport.use(new passport_jwt_1.Strategy(opts, (payload, done) => {
        const { id, email } = payload;
        // Send make the id and email available using "req.user.id" and "req.user.email"
        if (id && email)
            return done(null, { id, email });
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
    }));
};
//# sourceMappingURL=passport.js.map