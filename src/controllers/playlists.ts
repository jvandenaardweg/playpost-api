import { Request, Response } from 'express';
import { Playlist } from '../database/entities/playlist';
import { getRepository } from 'typeorm';
import { PlaylistItem } from '../database/entities/playlist-item';
import { Article } from '../database/entities/article';

const MESSAGE_PLAYLISTS_NO_ACCESS = 'You do not have access to this endpoint.';
const MESSAGE_PLAYLISTS_NOT_FOUND = 'Playlist does not exist. You should create one first.';
const MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST = 'You have no access to this playlist because it is not yours.';
const MESSAGE_PLAYLISTS_DEFAULT_EXISTS = 'There is already a Default playlist for you. We cannot create another one.';
const MESSAGE_PLAYLISTS_NAME_EXISTS = 'There is already a playlist with this name. We cannot create another one. Choose a different name.';
const MESSAGE_PLAYLISTS_NAME_REQUIRED = 'A name for a playlist is required.';
const MESSAGE_PLAYLISTS_ARTICLE_NOT_FOUND = 'Article does not exist';
const MESSAGE_PLAYLISTS_ARTICLE_EXISTS_IN_PLAYLIST = 'Article is already in this playlist.';

export const findAllPlaylists = async (req: Request, res: Response) => {
  const userEmail = req.user.email;
  const playlistRepository = getRepository(Playlist);

  if (userEmail !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: MESSAGE_PLAYLISTS_NO_ACCESS });

  const playlists = await playlistRepository.find({ relations: ['playlistItems'] });

  return res.json(playlists);
};

export const findPlaylistById = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { playlistId } = req.params;
  const playlistRepository = getRepository(Playlist);

  const playlist = await playlistRepository.findOne(playlistId, { relations: ['playlistItems', 'user'] });

  if (!playlist) return res.status(404).json({ message: MESSAGE_PLAYLISTS_NOT_FOUND });
  if (playlist.user.id !== userId) return res.status(403).json({ message: MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST });

  return res.json(playlist);
};

export const createPlaylist = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { name } = req.body;
  const playlistRepository = getRepository(Playlist);

  if (!name) return res.status(400).json({ message: MESSAGE_PLAYLISTS_NAME_REQUIRED });

  const playlist = await playlistRepository.findOne({ name, user: { id: userId } });

  if (playlist) return res.status(400).json({ message: MESSAGE_PLAYLISTS_NAME_EXISTS });

  const playlistToCreate = await playlistRepository.create({
    name,
    user: {
      id: userId
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

export const deletePlaylist = async (req: Request, res: Response) => {
  const userId = req.user.id;

  return res.json({ message: `Should delete a playlist for user ${userId}` });
};

export const createPlaylistItem = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const { playlistId, articleId } = req.params;

  const playlistItemRepository = getRepository(PlaylistItem);
  const playlistRepository = getRepository(Playlist);
  const articleRepository = getRepository(Article);

  const playlist = await playlistRepository.findOne(playlistId, { relations: ['user'] });

  if (!playlist) return res.status(400).json({ message: MESSAGE_PLAYLISTS_NOT_FOUND });

  if (playlist.user.id !== userId) return res.status(403).json({ message: MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST });

  const article = await articleRepository.findOne(articleId);

  if (!article) return res.status(400).json({ message: MESSAGE_PLAYLISTS_ARTICLE_NOT_FOUND });

  const playlistItem = await playlistItemRepository.findOne({
    article: {
      id: articleId
    },
    playlist: {
      id: playlistId
    }
  });

  if (playlistItem) return res.status(400).json({ message: MESSAGE_PLAYLISTS_ARTICLE_EXISTS_IN_PLAYLIST });

  // TODO: Set correct "order"
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
};

export const patchPlaylist = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { playlistId } = req.params;

  return res.json({ message: `Should patch playlist ID ${playlistId} for user ${userId}.` });
};

export const deletePlaylistItem = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { playlistId, articleId } = req.params;
  const playlistItemRepository = getRepository(PlaylistItem);

  const playlistItem = await playlistItemRepository.findOne({
    playlist: {
      id: playlistId
    },
    article: {
      id: articleId
    },
    user: {
      id: userId
    }
  });

  if (!playlistItem) return res.json({ message: 'Playlist item does not exist (anymore).' });

  await playlistItemRepository.remove(playlistItem);

  return res.json({ message: 'Playlist item is removed!' });
};
