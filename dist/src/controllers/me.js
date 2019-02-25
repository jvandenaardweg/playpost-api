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
const { prisma } = require('../../generated/prisma-client');
const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is (already) deleted.';
const MESSAGE_ME_NOT_UPDATED = 'Your account is not updated.';
const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';
const MESSAGE_ME_PASSWORD_REQUIRED = 'Password is required.';
const MESSAGE_ME_NOT_DELETED = 'Your account is not deleted. Probably because it is already deleted.';
const MESSAGE_ME_DELETED = 'Your account is deleted. This cannot be undone.';
const MESSAGE_ME_ARTICLE_ID_REQUIRED = 'ArticleId needs to be present.';
const MESSAGE_ME_FAVORITE_ARTICLE_NOT_FOUND = 'The Article you want to favorite is not found.';
const MESSAGE_ME_FAVORITE_ARTICLE_EXISTS = 'This article is already in your favorites, you cannot favorite it again.';
exports.getMe = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { id } = req.user;
    const fragment = `
    fragment GetUserWithoutPassword on User {
      id
      email
      createdAt
      updatedAt
      activatedAt
      authenticatedAt
    }
  `;
    const user = yield prisma.user({ id }).$fragment(fragment);
    if (!user)
        return res.status(404).json({ message: MESSAGE_ME_NOT_FOUND });
    return res.json(Object.assign({}, user));
});
exports.patchMeEmail = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { email } = req.body;
    const { id } = req.user;
    if (!email)
        return res.status(400).json({ message: MESSAGE_ME_EMAIL_REQUIRED });
    const fragment = `
    fragment PatchUserWithoutPassword on User {
      id
      email
      updatedAt
    }
  `;
    const updatedUser = yield prisma
        .updateUser({
        data: {
            email,
        },
        where: {
            id
        },
    })
        .$fragment(fragment);
    if (!updatedUser)
        return res.json({ message: MESSAGE_ME_NOT_UPDATED });
    return res.json(Object.assign({}, updatedUser));
});
exports.patchMePassword = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { password } = req.body;
    const { id } = req.user;
    if (!password)
        return res.status(400).json({ message: MESSAGE_ME_PASSWORD_REQUIRED });
    const fragment = `
    fragment PatchUserWithoutPassword on User {
      id
      email
      updatedAt
    }
  `;
    const hashedPassword = yield bcrypt.hash(password, 10);
    const updatedUser = yield prisma
        .updateUser({
        data: {
            password: hashedPassword,
        },
        where: {
            id
        },
    })
        .$fragment(fragment);
    if (!updatedUser)
        return res.json({ message: MESSAGE_ME_NOT_UPDATED });
    return res.json(Object.assign({}, updatedUser));
});
exports.deleteMe = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { id } = req.user;
    const deletedUser = yield prisma.deleteUser({ id });
    if (!deletedUser)
        return res.status(400).json({ message: MESSAGE_ME_NOT_DELETED });
    return res.json({ message: MESSAGE_ME_DELETED });
});
exports.createFavoriteArticle = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const userId = req.user.id;
    const { articleId } = req.body;
    if (!articleId)
        return res.status(400).json({ message: MESSAGE_ME_ARTICLE_ID_REQUIRED });
    const article = yield prisma.article({ id: articleId });
    if (!article)
        return res.status(400).json({ message: MESSAGE_ME_FAVORITE_ARTICLE_NOT_FOUND });
    const hasFavorite = yield prisma.$exists.favorite({
        article: {
            id: articleId
        },
        user: {
            id: userId
        }
    });
    if (hasFavorite)
        return res.status(400).json({ message: MESSAGE_ME_FAVORITE_ARTICLE_EXISTS });
    const favoriteArticle = yield prisma.createFavorite({
        article: {
            connect: {
                id: articleId
            }
        },
        user: {
            connect: {
                id: userId
            }
        }
    }).article();
    return res.json(favoriteArticle);
});
exports.findAllFavoriteArticles = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const userId = req.user.id;
    const fragment = `
    fragment BasicArticle on Article {
      article {
        id
        title
        description
        url
        sourceName
        authorName
        language
      }
    }
  `;
    const favorites = yield prisma
        .user({ id: userId })
        .favorites({ orderBy: 'createdAt_DESC' })
        .$fragment(fragment);
    if (!favorites.length)
        return res.json([]);
    const articles = favorites.length && favorites.map(favorite => favorite.article);
    return res.json(articles);
});
exports.findAllCreatedArticles = (req, res) => __awaiter(this, void 0, void 0, function* () {
    const userId = req.user.id;
    const articles = yield prisma.articles({
        where: {
            user: {
                id: userId
            }
        }
    });
    return res.json(articles);
});
//# sourceMappingURL=me.js.map