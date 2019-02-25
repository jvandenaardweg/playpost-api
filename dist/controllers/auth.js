"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../generated/prisma-client');
const { JWT_SECRET } = process.env;
const MESSAGE_AUTH_EMAIL_PASSWORD_REQUIRED = 'No e-mail and or password given.';
const MESSAGE_AUTH_USER_NOT_FOUND = 'No user found or password is incorrect.';
const MESSAGE_AUTH_PASSWORD_INCORRECT = 'Password is incorrect.';
exports.postAuth = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email && !password) {
        return res.status(400).json({ message: MESSAGE_AUTH_EMAIL_PASSWORD_REQUIRED });
    }
    const user = yield prisma.user({ email });
    if (!user)
        return res.status(400).json({ message: MESSAGE_AUTH_USER_NOT_FOUND });
    const isValidPassword = yield bcrypt.compare(password, user.password);
    // TODO: Log tries for security
    if (!isValidPassword)
        return res.status(400).json({ message: MESSAGE_AUTH_PASSWORD_INCORRECT });
    // Set a date to remember when the user last logged in
    yield prisma.updateUser({
        data: {
            authenticatedAt: new Date()
        },
        where: {
            id: user.id
        }
    });
    // We use the e-mail in the token as an extra way to get some easy context during debugging
    // For example, we can use the email in Sentry to maybe contact the user
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    return res.json({ token });
});
//# sourceMappingURL=auth.js.map