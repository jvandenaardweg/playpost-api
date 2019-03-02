import { Request, Response } from 'express';
const { prisma } = require('../generated/prisma-client');
import { Playlist } from '../database/entities/playlist';
import { getRepository, createQueryBuilder } from 'typeorm';
import { PlaylistItem } from '../database/entities/playlist-item';
import { Article } from '../database/entities/article';

const MESSAGE_PLAYLISTS_NO_ACCESS = 'You do not have access to this endpoint.';
const MESSAGE_PLAYLISTS_NOT_FOUND = 'Playlist does not exist. You should create one first.';
// const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is deleted.';
// const MESSAGE_ME_NOT_UPDATED = 'Your account is not updated.';
// const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';

export const findAllPlaylists = async (req: Request, res: Response) => {
  const { email } = req.user;
  const playlistRepository = getRepository(Playlist);

  if (email !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: MESSAGE_PLAYLISTS_NO_ACCESS });

  const playlists = await playlistRepository.find({ relations: ['articles'] });

  return res.json(playlists);
};

export const findPlaylistById = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { playlistId } = req.params;
  const playlistRepository = getRepository(Playlist);

  const playlist = await playlistRepository.findOne(playlistId, { relations: ['playlistItems', 'user'] });

  if (!playlist) return res.status(404).json({ message: MESSAGE_PLAYLISTS_NOT_FOUND });
  if (playlist.user.id !== userId) return res.status(403).json({ message: 'This is not your playlist.' });

  return res.json(playlist);
};

export const createDefaultPlaylist = async (req: Request, res: Response) => {
  const { id } = req.user;
  const playlistRepository = getRepository(Playlist);

  const playlist = await playlistRepository.findOne({ name: 'Default', user: { id } });

  if (playlist) return res.status(400).json({ message: 'There is already a Default playlist for you. We cannot create another one.' });

  const playlistToCreate = await playlistRepository.create({
    name: 'Default',
    user: {
      id
    }
  });

  const createdPlaylist = await playlistRepository.save(playlistToCreate);

  return res.json(createdPlaylist);
};

export const putPlaylists = async (req: Request, res: Response) => {
  const { url } = req.body;
  // First, check to see if we already have the article details
  // Else, crawl the article page and add it to the database
  return res.json({ message: 'update playlist, probably changing the order of articles for user ID: X' });
};

export const deletePlaylists = async (req: Request, res: Response) => {
  return res.json({ message: 'delete article from playlist for user ID: X' });
};

export const createPlaylistItem = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const { playlistId, articleId } = req.params;

  const playlistItemRepository = getRepository(PlaylistItem);
  const playlistRepository = getRepository(Playlist);
  const articleRepository = getRepository(Article);

  const playlist = await playlistRepository.findOne(playlistId, { relations: ['user'] });

  if (!playlist) return res.status(400).json({ message: 'Playlist does not exist.' });

  if (playlist.user.id !== userId) return res.status(403).json({ message: 'This playlist is not yours.' });

  const article = await articleRepository.findOne(articleId);

  if (!article) return res.status(400).json({ message: 'Article does not exist.' });

  const playlistItem = await playlistItemRepository.findOne({
    article: {
      id: articleId
    },
    playlist: {
      id: playlistId
    }
  });

  if (playlistItem) return res.status(400).json({ message: 'Article is already in this playlist.' });

  const playlistItemToCreate = await playlistItemRepository.create({
    article: {
      id: articleId
    },
    playlist: {
      id: playlistId
    },
    user: {
      id: userId
    }
  });

  const createdPlaylistItem = await playlistItemRepository.save(playlistItemToCreate);

  return res.json(createdPlaylistItem);
}
