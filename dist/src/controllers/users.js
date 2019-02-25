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
const { prisma } = require('../../generated/prisma-client');
const { JWT_SECRET } = process.env;
const MESSAGE_USER_EMAIL_PASSWORD_REQUIRED = 'No e-mail and or password given.';
const MESSAGE_USER_PASSWORD_INVALID = 'Password or e-mail address is incorrect.';
const MESSAGE_USER_EMAIL_EXISTS = 'E-mail address already exists.';
const MESSAGE_USER_NOT_FOUND = 'No user found';
const MESSAGE_USER_DELETED = 'User is deleted! This cannot be undone.';
exports.postUsers = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email && !password) {
        return res.status(400).json({ message: MESSAGE_USER_EMAIL_PASSWORD_REQUIRED });
    }
    const user = yield prisma.user({ email });
    if (user)
        return res.status(400).json({ message: MESSAGE_USER_EMAIL_EXISTS });
    const hashedPassword = yield bcrypt.hash(password, 10);
    const createdUser = yield prisma.createUser({
        email,
        password: hashedPassword
    });
    // Send a token within a successful signup, so we can log the user in right away
    const token = jwt.sign({ id: createdUser.id, email: createdUser.email }, JWT_SECRET);
    return res.json({ token });
});
exports.deleteUsers = (req, res) => __awaiter(this, void 0, void 0, function* () {
    // TODO: get auth user id
    const { email, password } = req.body;
    const user = yield prisma.user({ email });
    if (!user)
        return res.status(404).json({ message: MESSAGE_USER_NOT_FOUND });
    const isValidPassword = yield bcrypt.compare(password, user.password);
    if (!isValidPassword)
        return res.status(400).json({ message: MESSAGE_USER_PASSWORD_INVALID });
    yield prisma.deleteUser({ email });
    return res.json({ message: MESSAGE_USER_DELETED });
});
//# sourceMappingURL=users.js.map