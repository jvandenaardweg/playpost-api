import { Request, Response, NextFunction } from 'express';
const bcrypt = require('bcryptjs');
const { prisma } = require('../generated/prisma-client');

const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is (already) deleted.';
const MESSAGE_ME_NOT_UPDATED = 'Your account is not updated.';
const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';
const MESSAGE_ME_PASSWORD_REQUIRED = 'Password is required.';
const MESSAGE_ME_NOT_DELETED = 'Your account is not deleted. Probably because it is already deleted.';
const MESSAGE_ME_DELETED = 'Your account is deleted. This cannot be undone.';
const MESSAGE_ME_ARTICLE_ID_REQUIRED = 'ArticleId needs to be present.';
const MESSAGE_ME_FAVORITE_ARTICLE_NOT_FOUND = 'The Article you want to favorite is not found.';
const MESSAGE_ME_FAVORITE_ARTICLE_EXISTS = 'This article is already in your favorites, you cannot favorite it again.';

export const getMe = async (req: Request, res: Response) => {
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

  const user = await prisma.user({ id }).$fragment(fragment);

  if (!user) return res.status(404).json({ message: MESSAGE_ME_NOT_FOUND });

  return res.json({ ...user });
};

export const patchMeEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  const { id } = req.user;

  if (!email) return res.status(400).json({ message: MESSAGE_ME_EMAIL_REQUIRED });

  const fragment = `
    fragment PatchUserWithoutPassword on User {
      id
      email
      updatedAt
    }
  `;

  const updatedUser = await prisma
    .updateUser({
      data: {
        email,
      },
      where: {
        id
      },
    })
    .$fragment(fragment);

  if (!updatedUser) return res.json({ message: MESSAGE_ME_NOT_UPDATED });

  return res.json({ ...updatedUser });
};

export const patchMePassword = async (req: Request, res: Response) => {
  const { password } = req.body;
  const { id } = req.user;

  if (!password) return res.status(400).json({ message: MESSAGE_ME_PASSWORD_REQUIRED });

  const fragment = `
    fragment PatchUserWithoutPassword on User {
      id
      email
      updatedAt
    }
  `;

  const hashedPassword = await bcrypt.hash(password, 10);

  const updatedUser = await prisma
    .updateUser({
      data: {
        password: hashedPassword,
      },
      where: {
        id
      },
    })
    .$fragment(fragment);

  if (!updatedUser) return res.json({ message: MESSAGE_ME_NOT_UPDATED });

  return res.json({ ...updatedUser });
};

export const deleteMe = async (req: Request, res: Response) => {
  const { id } = req.user;

  const deletedUser = await prisma.deleteUser({ id });

  if (!deletedUser) return res.status(400).json({ message: MESSAGE_ME_NOT_DELETED });

  return res.json({ message: MESSAGE_ME_DELETED });
};

export const createFavoriteArticle = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { articleId } = req.body;

  if (!articleId) return res.status(400).json({ message: MESSAGE_ME_ARTICLE_ID_REQUIRED });

  const article = await prisma.article({ id: articleId });

  if (!article) return res.status(400).json({ message: MESSAGE_ME_FAVORITE_ARTICLE_NOT_FOUND });

  const hasFavorite = await prisma.$exists.favorite({
    article: {
      id: articleId
    },
    user: {
      id: userId
    }
  });

  if (hasFavorite) return res.status(400).json({ message: MESSAGE_ME_FAVORITE_ARTICLE_EXISTS });

  const favoriteArticle = await prisma.createFavorite({
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
};

export const findAllFavoriteArticles = async (req: Request, res: Response) => {
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

  const favorites: Array<any> = await prisma
    .user({ id: userId })
    .favorites({ orderBy: 'createdAt_DESC' })
    .$fragment(fragment);

  if (!favorites.length) return res.json([]);

  const articles = favorites.length && favorites.map(favorite => favorite.article);

  return res.json(articles);
};

export const findAllCreatedArticles = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const articles = await prisma.articles({
    where: {
      user: {
        id: userId
      }
    }
  });

  return res.json(articles);
};
