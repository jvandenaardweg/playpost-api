import { Request, Response } from 'express';
const { prisma } = require('../generated/prisma-client');

// const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is deleted.';
// const MESSAGE_ME_NOT_UPDATED = 'Your account is not updated.';
// const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';

export const getPlaylists = async (req: Request, res: Response) => {
  // TODO: get auth user id
  return res.json({ message: 'get the playlist from user ID: X' });
};

export const postPlaylists = async (req: Request, res: Response) => {
  // TODO: get auth user id
  const { articleId } = req.body;

  const article = await prisma.article({ id: articleId });

  if (!article) {
    // Create article, then add to playlist
    return;
  }

  // const addedToPlaylist = await prisma.createFavorite({});

  // First, check to see if we already have the article details
  // Else, crawl the article page and add it to the database
  return res.json({ message: `add article id "${articleId}" to playlist for user ID: X` });
};

export const putPlaylists = async (req: Request, res: Response) => {
  // TODO: get auth user id
  const { url } = req.body;
  // First, check to see if we already have the article details
  // Else, crawl the article page and add it to the database
  return res.json({ message: 'update playlist, probably changing the order of articles for user ID: X' });
};

export const deletePlaylists = async (req: Request, res: Response) => {
  // TODO: get auth user id
  return res.json({ message: 'delete article from playlist for user ID: X' });
};
