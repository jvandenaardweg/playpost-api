import { Request, Response } from 'express';
import { Playlist } from '../database/entities/playlist';
import { playlistInputValidationSchema } from '../database/validators';
import { getRepository, getManager } from 'typeorm';
import joi from 'joi';
import { PlaylistItem } from '../database/entities/playlist-item';
import { Article } from '../database/entities/article';

import { getNormalizedUrl } from '../utils/string';

const MESSAGE_PLAYLISTS_NO_ACCESS = 'You do not have access to this endpoint.';
const MESSAGE_PLAYLISTS_NOT_FOUND = 'Playlist does not exist. You should create one first.';
const MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST = 'You have no access to this playlist because it is not yours.';
const MESSAGE_PLAYLISTS_DEFAULT_EXISTS = 'There is already a Default playlist for you. We cannot create another one.';
const MESSAGE_PLAYLISTS_NAME_EXISTS = 'There is already a playlist with this name. We cannot create another one. Choose a different name.';
const MESSAGE_PLAYLISTS_ARTICLE_NOT_FOUND = 'Article does not exist';
const MESSAGE_PLAYLISTS_ARTICLE_EXISTS_IN_PLAYLIST = 'You already have this article in your playlist!';

export const findAllPlaylists = async (req: Request, res: Response) => {
  const userEmail = req.user.email;
  const playlistRepository = getRepository(Playlist);

  if (userEmail !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: MESSAGE_PLAYLISTS_NO_ACCESS });

  const playlists = await playlistRepository.find({ relations: ['playlistItems'] });

  // Sort by createdAt on playlistItems
  // TypeORM does not have a build in method to sort relations: https://github.com/typeorm/typeorm/issues/2620
  const sortedPlaylist = playlists.map((playlist) => {
    playlist.playlistItems.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return playlist;
  });

  return res.json(sortedPlaylist);
};

export const findPlaylistById = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { playlistId } = req.params;
  const playlistRepository = getRepository(Playlist);

  const { error } = joi.validate({ playlistId }, playlistInputValidationSchema.requiredKeys('playlistId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const playlist = await playlistRepository.findOne(playlistId, { relations: ['playlistItems', 'user'] });

  if (!playlist) return res.status(400).json({ message: MESSAGE_PLAYLISTS_NOT_FOUND });
  if (playlist.user.id !== userId) return res.status(403).json({ message: MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST });

  // Sort by createdAt on playlistItems
  // TypeORM does not have a build in method to sort relations: https://github.com/typeorm/typeorm/issues/2620
  if (playlist.playlistItems.length) {
    playlist.playlistItems.sort((a: any, b: any) => b.createdAt - a.createdAt);
  }

  return res.json(playlist);
};

export const createPlaylist = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { name } = req.body;
  const playlistRepository = getRepository(Playlist);

  const { error } = joi.validate({ userId, name }, playlistInputValidationSchema.requiredKeys('userId', 'name'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

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

// TODO: maybe only add the article URL and return a success or fail
// Then, after that's done, crawl the article
export const createPlaylistItemByArticleUrl = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { playlistId } = req.params;
  const { articleUrl } = req.body;

  const playlistItemRepository = getRepository(PlaylistItem);
  const playlistRepository = getRepository(Playlist);
  const articleRepository = getRepository(Article);

  const { error } = joi.validate({ playlistId, articleUrl }, playlistInputValidationSchema.requiredKeys('playlistId', 'articleUrl'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  let createdArticle: Article;

  // Normalize the URL
  // IMPORTANT: the normalized URL could still be different than the canonicalUrl in the database
  // For this we'll do an extra check later in the updateArticleToFull() method, to ensure we don't get duplicates
  // By doing it this way, we keep this method very quick and responsive for our user
  const normalizedUrl = getNormalizedUrl(articleUrl);

  // Get the playlist to check if it exists
  const playlist = await playlistRepository.findOne(playlistId, { relations: ['user'] });

  if (!playlist) return res.status(400).json({ message: MESSAGE_PLAYLISTS_NOT_FOUND });

  // Check if the user is the owner of that playlist
  if (playlist.user.id !== userId) return res.status(403).json({ message: MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST });

  // Find the article by "url" OR "canonicalUrl"
  const article = await articleRepository.findOne({
    where: [
      { url: normalizedUrl },
      { canonicalUrl: normalizedUrl }
    ]
  });

  // If there's an article, check if that one already exists in the user's playlist
  if (article) {
    const playlistItem = await playlistItemRepository.findOne({
      playlist: {
        id: playlistId
      },
      user: {
        id: userId
      },
      article: {
        id: article.id
      }
    });

    if (playlistItem) return res.status(400).json({ message: MESSAGE_PLAYLISTS_ARTICLE_EXISTS_IN_PLAYLIST });
  }

  // If we do not have an article yet, create one in the database...
  // ...so our crawler tries to fetch the article in the background
  if (!article) {
    const articleToCreate = await articleRepository.create({
      url: normalizedUrl,
      user: {
        id: userId
      }
    });

    createdArticle = await articleRepository.save(articleToCreate);
  }

  // The found article ID or the newly created article ID
  const articleId = (article) ? article.id : createdArticle.id;

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

export const createPlaylistItemByArticleId = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const { playlistId, articleId } = req.params;

  const playlistItemRepository = getRepository(PlaylistItem);
  const playlistRepository = getRepository(Playlist);
  const articleRepository = getRepository(Article);

  const { error } = joi.validate({ playlistId, articleId }, playlistInputValidationSchema.requiredKeys('playlistId', 'articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const playlist = await playlistRepository.findOne(playlistId, { relations: ['user'] });

  if (!playlist) return res.status(400).json({ message: MESSAGE_PLAYLISTS_NOT_FOUND });

  if (playlist.user.id !== userId) return res.status(403).json({ message: MESSAGE_PLAYLISTS_NO_ACCESS_PLAYLIST });

  const article = await articleRepository.findOne(articleId);

  if (!article) return res.status(400).json({ message: MESSAGE_PLAYLISTS_ARTICLE_NOT_FOUND });

  const playlistItem = await playlistItemRepository.findOne({
    user: {
      id: userId
    },
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

/**
 * Allows the user to give a custom order to the playlist items
 *
 */
export const patchPlaylistItemOrder = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { playlistId, playlistItemId } = req.params;
  const { order } = req.body;

  const { error } = joi.validate({ playlistId, playlistItemId, order }, playlistInputValidationSchema.requiredKeys('playlistId', 'playlistItemId', 'order'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

  const newOrderNumber = parseInt(order, 10); // Convert string to integer, so we can compare

  if (!newOrderNumber) return res.status(400).json({ message: 'The given order needs to be 1 or higher.' });

  const playlistItemRepository = getRepository(PlaylistItem);

  // Find the playlistItem of the current user to verify he can do this action
  const playlistItem = await playlistItemRepository.findOne(playlistItemId, {
    relations: ['user'],
    where: {
      id: playlistItemId,
      playlist: {
        id: playlistId
      }
    }
  });

  if (!playlistItem) return res.status(400).json({ message: 'The given playlist item does not exist.' });

  if (playlistItem.user.id !== userId) return res.status(400).json({ message: 'You do not have access to this playlist.' });

  const currentOrderNumber = playlistItem.order;
  const move = (newOrderNumber > currentOrderNumber) ? 'down' : 'up';

  // The order is the same, just return success, no need to update the database for this
  if (currentOrderNumber === newOrderNumber) return res.status(200).json({ message: 'The given order is the same. We do not update the order.' });

  // Re-ordering the given playlist of the current user
  // Helpful: https://blogs.wayne.edu/web/2017/03/13/updating-a-database-display-order-with-drag-and-drop-in-sql/

  // Re-order all the playlist items in the playlistId of the logged in user
  await getManager().transaction(async (transactionalEntityManager) => {
    try {
      // Move the playlistItem out of the normal ordering temporary, this creates a gap
      await transactionalEntityManager.createQueryBuilder()
      .update(PlaylistItem)
      .set({ order: -1 })
      .where('"id" = :id', { id: playlistItemId })
      .andWhere('"userId" = :userId', { userId })
      .andWhere('"playlistId" = :playlistId', { playlistId })
      .execute();

      // Move all other playlistItem's to their new position...
      if (move === 'up') {
        // If we move the item up, we need to increment the order of all the items above the newOrderNumber
        await transactionalEntityManager.createQueryBuilder()
        .update(PlaylistItem)
        .set({ order: () => '"order" + 1' })
        .where('"order" >= :newOrderNumber', { newOrderNumber })
        .andWhere('"order" < :currentOrderNumber', { currentOrderNumber })
        .andWhere('"userId" = :userId', { userId })
        .andWhere('"playlistId" = :playlistId', { playlistId })
        .execute();
      } else {
        // If we move the item down, we need to decrement the order of all the items below the newOrderNumber
        await transactionalEntityManager.createQueryBuilder()
        .update(PlaylistItem)
        .set({ order: () => '"order" - 1' })
        .where('"order" > :currentOrderNumber', { currentOrderNumber })
        .andWhere('"order" <= :newOrderNumber', { newOrderNumber })
        .andWhere('"userId" = :userId', { userId })
        .andWhere('"playlistId" = :playlistId', { playlistId })
        .execute();
      }

      // Fill the gap!
      // Set newOrder to the given playlistItem
      await transactionalEntityManager.createQueryBuilder()
      .update(PlaylistItem)
      .set({ order: newOrderNumber })
      .where('id = :id', { id: playlistItemId })
      .andWhere('"userId" = :userId', { userId })
      .andWhere('"playlistId" = :playlistId', { playlistId })
      .execute();

      // Done! Playlist item's should now be re-ordered
      return res.json({ message: 'Playlist is re-ordered!' });
    } catch (err) {
      throw err;
    }
  });
};

export const deletePlaylistItem = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { playlistId, articleId } = req.params;
  const playlistItemRepository = getRepository(PlaylistItem);

  const { error } = joi.validate({ playlistId, articleId }, playlistInputValidationSchema.requiredKeys('playlistId', 'articleId'));

  if (error) {
    const messageDetails = error.details.map(detail => detail.message).join(' and ');
    return res.status(400).json({ message: messageDetails });
  }

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

  if (!playlistItem) return res.status(400).json({ message: 'Playlist item does not exist (anymore).' });

  await playlistItemRepository.remove(playlistItem);

  return res.json({ message: 'Playlist item is removed!' });
};
