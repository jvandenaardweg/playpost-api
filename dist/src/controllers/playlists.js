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
const { prisma } = require('../../generated/prisma-client');
// const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is deleted.';
// const MESSAGE_ME_NOT_UPDATED = 'Your account is not updated.';
// const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';
exports.getPlaylists = (req, res) => __awaiter(this, void 0, void 0, function* () {
    // TODO: get auth user id
    return res.json({ message: 'get the playlist from user ID: X' });
});
exports.postPlaylists = (req, res) => __awaiter(this, void 0, void 0, function* () {
    // TODO: get auth user id
    const { articleId } = req.body;
    const article = yield prisma.article({ id: articleId });
    if (!article) {
        // Create article, then add to playlist
        return;
    }
    // const addedToPlaylist = await prisma.createFavorite({});
    // First, check to see if we already have the article details
    // Else, crawl the article page and add it to the database
    return res.json({ message: `add article id "${articleId}" to playlist for user ID: X` });
});
exports.putPlaylists = (req, res) => __awaiter(this, void 0, void 0, function* () {
    // TODO: get auth user id
    const { url } = req.body;
    // First, check to see if we already have the article details
    // Else, crawl the article page and add it to the database
    return res.json({ message: 'update playlist, probably changing the order of articles for user ID: X' });
});
exports.deletePlaylists = (req, res) => __awaiter(this, void 0, void 0, function* () {
    // TODO: get auth user id
    return res.json({ message: 'delete article from playlist for user ID: X' });
});
//# sourceMappingURL=playlists.js.map