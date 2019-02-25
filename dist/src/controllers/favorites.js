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
// const { prisma } = require('../../generated/prisma-client');
// const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is deleted.';
// const MESSAGE_ME_NOT_UPDATED = 'Your account is not updated.';
// const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';
exports.getFavorites = (req, res) => __awaiter(this, void 0, void 0, function* () {
    // TODO: get auth user id
    return res.json({ message: 'get the favorites from user ID: X' });
});
exports.postFavorites = (req, res) => __awaiter(this, void 0, void 0, function* () {
    // TODO: get auth user id
    const { id } = req.body;
    return res.json({ message: `add article ${id} to favorites for user ID: X` });
});
exports.deleteFavorites = (req, res) => __awaiter(this, void 0, void 0, function* () {
    // TODO: get auth user id
    return res.json({ message: 'delete article from favorites for user ID: X' });
});
//# sourceMappingURL=favorites.js.map